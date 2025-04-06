import expirationNotificationEmails from 'cli/commands/expirationNotificationEmails';
import orgUsageTracker from 'cli/commands/orgUsageTracker';
import * as redis from 'lib/connections/redis'; // Using the defined redis.js
import logger from 'lib/logger';
import cachePrefix from 'lib/helpers/cachePrefix';
import runBatchDelete from './scheduler/batchDelete'; // Assuming runBatchDelete is also self-scheduling

/**
 * Runs expirationNotificationEmails every 15 minutes.
 * Uses Redis distributed lock to ensure execution only by one instance.
 */
const EXPIRATION_TIMEOUT_MSEC = 15 * 60 * 1000;
const EXPIRATION_LOCK_DURATION_SEC = 60; // Least increased lock duration for more security
const EXPIRATION_CACHE_KEY = cachePrefix('EXPIRATION_SCHEDULER:RUNNING');

const runExpiration = async () => {
  const startTime = Date.now();

  try { // Wraps the entire logic in try to ensure setTimeout
    await redis.withRedisClient(async (redisClient) => {
      const res = await redisClient.set(EXPIRATION_CACHE_KEY, 1, 'EX', EXPIRATION_LOCK_DURATION_SEC, 'NX');

      if (res === 'OK') {
        logger.info('Processing expiration notification emails...');
        try {
          // Adds try...catch around the task itself
          await expirationNotificationEmails({ dontExit: true });
          logger.info('Finished processing expiration notification emails.');
        } catch (taskError) {
          logger.error('Error processing expiration notification emails task:', taskError);
          // Task error should not stop the scheduler, just logs
        }
      } else {
        logger.debug('Skipping expiration notification emails (lock not acquired).');
      }
    });
  } catch (error) {
    // Catches Redis errors (e.g., connection breaks)
    logger.error('Error during expiration scheduler Redis operation:', error);
  } finally {
    // Ensures that the next execution is always scheduled
    const delay = Math.max(0, EXPIRATION_TIMEOUT_MSEC - (Date.now() - startTime)); // Ensures the delay is not negative
    setTimeout(runExpiration, delay);
  }
};

/**
 * Runs orgUsageTracker every 5 minutes.
 * Uses Redis distributed lock to ensure execution only by one instance.
 * (Changed from daily to 5 minutes for consistency and responsiveness)
 */
const USAGE_TRACKER_TIMEOUT_MSEC = 5 * 60 * 1000;
const USAGE_TRACKER_LOCK_DURATION_SEC = 60; // Least increased lock duration
const USAGE_TRACKER_CACHE_KEY = cachePrefix('USAGE_TRACKER_SCHEDULER:RUNNING');

const runUsageTracker = async () => {
  const startTime = Date.now();

  try { // Wraps the entire logic in try to ensure setTimeout
    await redis.withRedisClient(async (redisClient) => {
      const res = await redisClient.set(USAGE_TRACKER_CACHE_KEY, 1, 'EX', USAGE_TRACKER_LOCK_DURATION_SEC, 'NX');

      if (res === 'OK') {
        logger.info('Processing usage tracker...');
        try {
          // Adds try...catch around the task itself
          await orgUsageTracker({ dontExit: true });
          logger.info('Finished processing usage tracker.');
        } catch (taskError) {
          logger.error('Error processing usage tracker task:', taskError);
          // Task error should not stop the scheduler, just logs
        }
      } else {
        logger.debug('Skipping usage tracker (lock not acquired).');
      }
    });
  } catch (error) {
    // Catches Redis errors
    logger.error('Error during usage tracker scheduler Redis operation:', error);
  } finally {
    // Ensures that the next execution is always scheduled
    const delay = Math.max(0, USAGE_TRACKER_TIMEOUT_MSEC - (Date.now() - startTime)); // Ensures the delay is not negative
    setTimeout(runUsageTracker, delay);
  }
};

/**
 * Main function to start all schedulers.
 */
export default async () => {
  logger.info('Starting schedulers...');

  // Starts the scheduling loops
  // await is not needed here as the functions themselves take care of recursive calling
  runExpiration();
  runUsageTracker();
  runBatchDelete(); // Assuming runBatchDelete is also self-scheduling

  logger.info('Schedulers started.');

  // Clean up on process exit
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received. Closing Redis pool...');
    try {
      await redis.closePool();
      logger.info('Redis pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing Redis pool during SIGTERM:', err);
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received. Closing Redis pool...');
    try {
      await redis.closePool();
      logger.info('Redis pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing Redis pool during SIGINT:', err);
      process.exit(1);
    }
  });
};
