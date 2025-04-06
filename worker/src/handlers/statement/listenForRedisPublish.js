import logger from 'lib/logger';
import Statement from 'lib/models/statement';
import statementHandler from 'worker/handlers/statement/statementHandler';
import * as redis from 'lib/connections/redis'; // Import our redis module
import cachePrefix from 'lib/helpers/cachePrefix';
// Note: The 'async' library is no longer needed

const redisOpts = redis.getOptions(); // Get options once

/**
 * Main function to start the worker that listens for Redis Pub/Sub
 * and processes tasks from Redis List.
 */
export default async () => {
  let subClient = null; // The subscription client must live longer

  try {
    // Create the subscription client manually using acquire from the pool
    // We must release it manually when stopping (in SIGTERM/SIGINT)
    subClient = await redis.createClient(); // createClient uses pool.acquire()
    if (!subClient) {
        throw new Error('Failed to acquire Redis client for subscription');
    }

    const subKey = cachePrefix('statement.notify');
    logger.debug('Using redis options:', redisOpts);
    logger.info(`Subscribing to '${subKey}'`);

    let currentlyWorking = false; // Local flag for the process

    subClient.on('message', async (channel) => {
      logger.debug(`Message received on channel '${channel}'`);

      // Check the local flag
      if (currentlyWorking) {
        logger.debug('Already working, skipping message processing trigger.');
        return;
      }

      currentlyWorking = true;
      logger.info('Starting processing of statement queue...');

      try {
        // Use withRedisClient for the client that will do RPOP
        // It is taken and released for each processing series
        await redis.withRedisClient(async (pubClient) => {
          const pubKey = cachePrefix('statement.new');
          logger.info(`Processing items from list '${pubKey}'`);
          let payload = null;

          // Use while loop with await instead of async.doUntil
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              payload = await pubClient.rpop(pubKey); // Wait for rpop

              if (payload === null) {
                // The list is empty, stop the cycle
                logger.info(`List '${pubKey}' is empty. Stopping processing.`);
                break;
              }

              logger.debug(`Popped from '${pubKey}':`, payload);
              let parsedPayload;
              try {
                  parsedPayload = JSON.parse(payload);
                  if (!parsedPayload || !parsedPayload.statementId) {
                      logger.error(`Invalid payload format popped from ${pubKey}: ${payload}`);
                      continue; // Proceed to the next element
                  }
              } catch (parseError) {
                  logger.error(`Failed to parse JSON payload from ${pubKey}: ${payload}`, parseError);
                  continue; // Proceed to the next element
              }


              try {
                // Get statement from MongoDB
                const statement = await Statement.findOne({ 'statement.id': parsedPayload.statementId }).lean(); // Use lean for better performance

                if (!statement) {
                  logger.warn(`Statement with statement.id ${parsedPayload.statementId} not found in DB.`);
                  continue; // Proceed to the next element
                }

                // Call statementHandler - still fire-and-forget, but with try/catch
                try {
                  // Do not await if we do not want to block the processing of the list,
                  // but we must catch the errors from the handler itself
                  statementHandler({ statementId: statement._id });
                  logger.debug(`Dispatched statement ${statement._id} to statementHandler.`);
                } catch (handlerError) {
                  logger.error(`Error occurred within statementHandler for statement ${statement._id}:`, handlerError);
                  // Handler error should not stop the entire cycle
                }

              } catch (dbError) {
                logger.error(`Error finding statement with statement.id ${parsedPayload.statementId}:`, dbError);
                // If there is a DB error, we may want to stop or try again later
                // For now, log and proceed with the next element
                continue;
              }

            } catch (rpopError) {
              logger.error('Error during Redis RPOP operation:', rpopError);
              // If RPOP gave an error, probably there is a connection problem, stop the cycle
              break;
            }
          } // end of while loop
        }); // end of withRedisClient for pubClient
      } catch (processingError) {
        // Error during getting/releasing pubClient or other unexpected error
        logger.error('Error during statement queue processing cycle:', processingError);
      } finally {
        // Regardless of whether there was an error or the cycle completed normally,
        // release the local flag
        currentlyWorking = false;
        logger.info('Finished processing cycle for statement queue.');
      }
    }); // end of subClient.on('message')

    // Subscribe as SUBSCRIBE after we have set up 'message' handler
    await subClient.subscribe(subKey);
    logger.info(`Successfully subscribed to '${subKey}'`);

  } catch (err) {
    logger.error('Error setting up Redis subscription worker:', err);
    // If we have subClient, try to release it
    if (subClient && typeof subClient.quit === 'function') {
      try {
        await redis.releaseClient(subClient); // Use releaseClient from the pool
      } catch (releaseErr) {
        logger.error('Error releasing subscription client after setup failure:', releaseErr);
      }
    }
    // Pass the error forward so the process can fail at startup if needed
    throw err;
  }

  // Graceful shutdown function
  const shutdown = async () => {
    logger.info('Shutting down Redis subscription worker...');
    if (subClient) {
      try {
        // Stop the subscription and release the client
        await subClient.unsubscribe();
        await subClient.quit(); // ioredis recommends quit after unsubscribe
        // Although quit may remove it from the pool via 'error' event,
        // explicit release is safer for our custom pool
        await redis.releaseClient(subClient);
        logger.info('Subscription client unsubscribed and released.');
      } catch (err) {
        logger.error('Error during subscription client shutdown:', err);
      }
    }
    try {
      // Close the entire pool
      await redis.closePool();
      logger.info('Redis pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing Redis pool during shutdown:', err);
      process.exit(1);
    }
  };

  // Clean up on process exit
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info('Redis subscription worker started successfully.');
};
