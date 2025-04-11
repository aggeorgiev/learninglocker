import Queue from 'bull';
import logger from 'lib/logger';
import { isString, values } from 'lodash';
import * as redis from 'lib/connections/redis';
import { Promise } from 'bluebird';
import Redis from 'ioredis'; // Import Redis directly to check instance

const Bull = {
  queues: {}
};

const logError = queueName => (error) => {
  logger.error(`QUEUE ERROR: ${queueName}`, error);
};

const removeJob = (job) => {
  logger.debug(`REMOVING JOB ${job.id}`);
  job.remove();
};

// Bull requires a direct Redis client, not one obtained from a pool
// The issue is that the pool.acquire() returns a promise, but Bull expects a synchronous Redis client
export const getQueue = (queueName, done) => {
  if (!Bull.queues[queueName]) {
    try {
      // Instead of using the pool, use direct Redis options
      const redisOptions = redis.getOptions();
      
      Bull.queues[queueName] = new Queue(
        queueName,
        {
          // Pass in Redis options directly, not a client creation function
          redis: redisOptions
        }
      )
        .on('error', logError(queueName))
        .on('completed', (job) => {
          logger.debug(`COMPLETED JOB ${job.id}`);
          removeJob(job);
        })
        .on('failed', (job, err) => {
          const queue = err.queue || {};
          const failedQueueName = queue.name || 'No queue';
          logger.debug(`JOB ${job.id} FAILED`, failedQueueName);
          removeJob(job);
        });
    } catch (err) {
      logger.error(`Error creating queue ${queueName}:`, err);
      return done(err);
    }
  }
  return done(null, Bull.queues[queueName]);
};

export const publish = ({
  queueName,
  payload
}, done) => {
  getQueue(queueName, (err, queue) => {
    if (err) return done(err);
    return queue.add(payload, {
      removeOnFail: false,
      removeOnComplete: false // Doesn't work ? :(
    }).then(() => {
      done(null);
    }).catch(logError(queueName));
  });
};

const sendDeadLetter = ({ queueName, deadLetter }) => async (data) => {
  let deadLetterFullName;
  if (!deadLetter) {
    return;
  }
  if (isString(deadLetter)) {
    deadLetterFullName = deadLetter;
  } else {
    deadLetterFullName = `${queueName}_DEADLETTER`;
  }
  const deadLetterQueue = await new Promise((resolve, reject) =>
    getQueue(deadLetterFullName, (err, queue) => (err ? reject(err) : resolve(queue)))
  );
  return deadLetterQueue.add(data);
};

export const subscribe = ({
  queueName,
  handler,
  onProcessed = () => { },
  deadLetter
}, done) => {
  getQueue(queueName, (err, queue) => {
    if (err) return done(err);
    queue.on('completed', (job) => {
      onProcessed({
        Body: JSON.stringify(job.data)
      });
    });
    if (deadLetter) {
      queue.on('failed', (job) => {
        sendDeadLetter({
          queueName,
          deadLetter
        })(job.data);
      });
    }
    try {
      queue.process((job, jobDone) => handler(job.data, jobDone));
      return done(null);
    } catch (err) {
      return done(err);
    }
  });
};

export const unsubscribeAll = async () => {
  const queues = values(Bull.queues);
  await Promise.map(queues, queue => queue.close());
  
  Bull.queues = {};
};