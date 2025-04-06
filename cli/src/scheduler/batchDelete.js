import mongoose from 'mongoose';
// import boolean from 'boolean'; // No longer needed for ENABLE_STATEMENT_DELETION
import * as redis from 'lib/connections/redis'; // Using the defined redis.js
import logger from 'lib/logger';
// import { get } from 'lodash'; // No longer needed for process.env
import { each } from 'bluebird'; // Can be replaced with Promise.all(map) or for...of, but keeping for now
import SiteSettings from 'lib/models/siteSettings';
import BatchDelete, { inWindow, nextRunAtDateTime } from 'lib/models/batchDelete';
import { SITE_SETTINGS_ID } from 'lib/constants/siteSettings';
// import moment from 'moment'; // No longer needed for calculating next window
import { publish as publishQueue } from 'lib/services/queue'; // Using directly imported function
import { BATCH_STATEMENT_DELETION_QUEUE } from 'lib/constants/batchDelete';
import cachePrefix from 'lib/helpers/cachePrefix';

const objectId = mongoose.Types.ObjectId;

const BATCH_STATEMENT_DELETION_LOCK_TIMEOUT_SEC = 60; // Increased lock time for more security
const BATCH_STATEMENT_DELETION_CACHE_KEY = cachePrefix('BATCH_STATEMENT_DELETION_SCHEDULER:RUNNING');
const BATCH_DELETE_CHECK_INTERVAL_MSEC = 30 * 1000; // Check interval (30 seconds)

/**
 * Periodically checks for scheduled batch delete tasks and starts them
 * if they are within the allowed window.
 * Uses Redis distributed lock.
 */
const runBatchDelete = async () => {
  const startTime = Date.now();

  try { // Wrap the entire logic in try to ensure setTimeout
    await redis.withRedisClient(async (redisClient) => {
      const res = await redisClient.set(
        BATCH_STATEMENT_DELETION_CACHE_KEY,
        1,
        'EX',
        BATCH_STATEMENT_DELETION_LOCK_TIMEOUT_SEC,
        'NX'
      );

      if (res === 'OK') {
        logger.info('Processing batch delete tasks...');
        try {
          // Add try...catch around the main logic
          const siteSettings = await SiteSettings.findOne({ _id: SITE_SETTINGS_ID });
          if (!siteSettings) {
            logger.warn('SiteSettings not found, cannot determine deletion window.');
            return; // Exit if no settings found
          }

          // Find tasks that are scheduled and whose time has come
          const batchDeletes = await BatchDelete.find({
            status: 'SCHEDULED',
            nextRunAt: { $lte: new Date() }
          });

          if (batchDeletes.length > 0) {
            logger.info(`Found ${batchDeletes.length} due batch delete tasks.`);
          } else {
             logger.info(`No due batch delete tasks found.`);
          }

          // Using Bluebird.each, but can be replaced with Promise.all(map) or for...of
          await each(batchDeletes, async (batchDelete) => {
            try { // Add try...catch for each individual task
              const now = new Date();
              // Check if we are in the deletion window
              const inDeletionWindow = inWindow(now, siteSettings);
              // Calculate next check/execution time
              const nextRunAt = nextRunAtDateTime(now, siteSettings);

              if (inDeletionWindow) {
                logger.info(`Task ${batchDelete._id} is within the deletion window. Publishing to queue...`);
                // Publish the task to the queue for actual deletion
                await publishQueue({ // Using the directly imported function
                  queueName: BATCH_STATEMENT_DELETION_QUEUE,
                  payload: {
                    batchDeleteId: batchDelete._id.toString()
                  }
                });
                // Update status to 'PROCESSING'
                await BatchDelete.updateOne(
                  { _id: batchDelete._id },
                  { $set: { status: 'PROCESSING', nextRunAt } } // Set nextRunAt as well
                );
                 logger.info(`Task ${batchDelete._id} status set to PROCESSING, next check at ${nextRunAt}.`);
              } else {
                // If not in window, just update nextRunAt and keep status as 'SCHEDULED'
                await BatchDelete.updateOne(
                  { _id: batchDelete._id },
                  { $set: { nextRunAt } } // Status remains 'SCHEDULED'
                );
                logger.info(`Task ${batchDelete._id} is outside the deletion window. Rescheduled check for ${nextRunAt}.`);
              }
            } catch (taskProcessingError) {
               logger.error(`Error processing individual batch delete task ${batchDelete._id}:`, taskProcessingError);
               // Continue with next task even if one fails
            }
          });
           logger.info('Finished processing due batch delete tasks.');
        } catch (mainLogicError) {
          logger.error('Error during main batch delete processing logic:', mainLogicError);
          // Error in main logic (e.g., find) should not stop the scheduler
        }
      } else {
        logger.debug('Skipping batch delete check (lock not acquired).');
      }
    });
  } catch (error) {
    // Catch errors when working with Redis
    logger.error('Error during batch delete scheduler Redis operation:', error);
  } finally {
    // Ensure that the next execution is always scheduled
    // Use fixed interval for checking, not calculation to next window
    const delay = Math.max(0, BATCH_DELETE_CHECK_INTERVAL_MSEC - (Date.now() - startTime));
    setTimeout(runBatchDelete, delay);
  }
};

export default runBatchDelete;
