import Queue from 'bull';
import logger from 'lib/logger';
import { isString, values } from 'lodash';
import * as redis from 'lib/connections/redis'; // Import redis.js for getOptions
import { Promise } from 'bluebird'; // Bluebird is still used for Promise.map in unsubscribeAll

// Cache for queue instances
const Bull = {
  queues: {}
};

// Helper function for logging queue errors
const logError = queueName => (error) => {
  logger.error(`QUEUE ERROR: ${queueName}`, error);
  // You can add more detailed logging or notifications here
};

// Helper async function for removing a job
const removeJob = async (job) => {
  if (job && typeof job.remove === 'function') {
    try {
      logger.debug(`REMOVING JOB ${job.id}`);
      await job.remove(); // Wait for removal
      logger.debug(`REMOVED JOB ${job.id}`);
    } catch (removeErr) {
      logger.error(`Failed to remove job ${job.id}:`, removeErr);
      // Error during removal is usually not critical, but it's good to log
    }
  } else {
      logger.warn(`Attempted to remove invalid job object: ${job ? job.id : 'undefined'}`);
  }
};

/**
 * Asynchronously gets or creates a Bull queue instance.
 * No longer uses callback (done).
 * Passes Redis options to Bull, instead of createClient.
 * @param {string} queueName - The name of the queue.
 * @returns {Promise<Queue>} - Promise that resolves with the queue instance.
 */
export const getQueue = async (queueName) => {
  if (!Bull.queues[queueName]) {
    try {
      // Get connection options from redis.js
      const redisOptions = redis.getOptions();
      logger.info(`Creating Bull queue "${queueName}"`);
      logger.silly('Using Redis options for Bull:', redisOptions);

      // Create a new Bull queue, directly passing Redis options.
      // Bull will use these options to create its own ioredis clients.
      const newQueue = new Queue(queueName, { redis: redisOptions });

      // Add event listeners
      newQueue
        .on('error', logError(queueName))
        .on('completed', (job) => {
          logger.debug(`COMPLETED JOB ${job.id} in queue ${queueName}`);
          removeJob(job); // Call async function
        })
        .on('failed', (job, err) => {
          const queue = err.queue || {};
          const failedQueueName = queue.name || 'No queue';
          logger.error(`JOB ${job.id} FAILED in queue ${failedQueueName}`, err); // Log and error
          removeJob(job); // Call async function
        });

      Bull.queues[queueName] = newQueue;
    } catch (creationError) {
      logger.error(`Failed to create Bull queue "${queueName}":`, creationError);
      throw creationError; // Forward error
    }
  }
  return Bull.queues[queueName];
};

/**
 * Asynchronously publishes a job to a queue.
 * No longer uses callback (done).
 * @param {object} options - Publish options.
 * @param {string} options.queueName - The name of the queue.
 * @param {object} options.payload - The data for the job.
 * @returns {Promise<void>} - Promise that resolves when job is successfully added.
 */
export const publish = async ({ queueName, payload }) => {
  try {
    const queue = await getQueue(queueName); // Wait for getting/creating the queue
    logger.debug(`Publishing job to queue "${queueName}"`, payload);
    // Wait for job addition
    await queue.add(payload, {
      removeOnFail: true, // It's recommended that Bull clean up failed jobs
      removeOnComplete: true // It's recommended that Bull clean up completed jobs
      // The comment "// Doesn't work ? :(" probably refers to an old version or configuration.
      // removeOnComplete/removeOnFail are standard options.
    });
    logger.debug(`Successfully published job to queue "${queueName}"`);
  } catch (error) {
    logError(queueName)(error); // Use logError for consistency
    throw error; // Forward error, so the calling code can react
  }
};

// sendDeadLetter remains almost the same, but uses await getQueue
const sendDeadLetter = ({ queueName, deadLetter }) => async (data) => {
  let deadLetterFullName;
  if (!deadLetter) {
    return; // If not configured, do nothing
  }

  if (isString(deadLetter)) {
    deadLetterFullName = deadLetter;
  } else {
    deadLetterFullName = `${queueName}_DEADLETTER`;
  }

  try {
    logger.warn(`Sending job data from queue "${queueName}" to dead-letter queue "${deadLetterFullName}"`);
    // Wait for getting dead-letter queue
    const deadLetterQueue = await getQueue(deadLetterFullName);
    // Add data to dead-letter queue
    await deadLetterQueue.add(data, {
        removeOnComplete: true, // It's good to clean up these too
        removeOnFail: true // If this fails, there's probably a more serious problem
    });
  } catch (error) {
    logger.error(`Failed to send job data to dead-letter queue "${deadLetterFullName}":`, error);
    // Error here is a problem, but it shouldn't stop the main stream
  }
};

/**
 * Asynchronously subscribes a worker to a queue.
 * No longer uses callback (done).
 * @param {object} options - Subscribe options.
 * @param {string} options.queueName - The name of the queue.
 * @param {function} options.handler - The function that will handle the jobs (job.data, jobDone).
 * @param {function} [options.onProcessed=() => {}] - Function called after successful processing.
 * @param {boolean|string} [options.deadLetter] - Configuration for dead-letter queue.
 * @returns {Promise<void>} - Promise that resolves when successfully subscribed.
 */
export const subscribe = async ({
  queueName,
  handler,
  onProcessed = () => {},
  deadLetter
}) => {
  try {
    const queue = await getQueue(queueName); // Wait for the queue

    // Add specific listeners for this subscription
    // Note: These listeners will be added every time subscribe is called for the same queue.
    // If this is not desired, the structure must be changed.
    queue.on('completed', (job) => {
      try {
          // Wrap in try/catch, to not break onProcessed entire process
          onProcessed({ Body: JSON.stringify(job.data) });
      } catch (onProcessedError) {
          logger.error(`Error in onProcessed callback for job ${job.id} in queue ${queueName}:`, onProcessedError);
      }
    });

    if (deadLetter) {
      queue.on('failed', (job) => {
        // sendDeadLetter is already async and handles its own errors
        sendDeadLetter({ queueName, deadLetter })(job.data);
      });
    }

    // Register main handler
    // queue.process can throw an error if there's already an active handler with different concurrency
    queue.process((job, jobDone) => {
        // Good practice is to wrap and handler in try/catch
        try {
            // Pass job.data and jobDone to original handler
            handler(job.data, jobDone);
        } catch (handlerError) {
            logger.error(`Unhandled error in handler for job ${job.id} in queue ${queueName}:`, handlerError);
            // Signal to Bull that the job is failed
            jobDone(handlerError);
        }
    });

    logger.info(`Worker subscribed to queue "${queueName}"`);
  } catch (error) {
    logger.error(`Failed to subscribe worker to queue "${queueName}":`, error);
    throw error; // Forward error
  }
};

/**
 * Asynchronously closes all cached queue instances.
 * @returns {Promise<void>}
 */
export const unsubscribeAll = async () => {
  const queuesToClose = values(Bull.queues);
  logger.info(`Closing ${queuesToClose.length} Bull queue instances...`);
  // Use Promise.all and map for parallel closing
  await Promise.all(queuesToClose.map(queue => queue.close()));
  Bull.queues = {}; // Clear cache
  logger.info('All Bull queue instances closed.');
};

// Cleanup on process exit - remains the same, but it's good to be in the main starting file
// If this module is loaded from different places, this handler may be registered multiple times.
// Moving it to the main file (like cli/src/scheduler.js) is a better practice.
/*
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received in Bull module. Closing queues...');
  await unsubscribeAll();
  await redis.closePool(); // Close Redis pool
  logger.info('Bull queues and Redis pool closed in Bull module.');
});
*/
