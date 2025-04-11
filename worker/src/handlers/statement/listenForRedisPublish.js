import async from 'async';
import logger from 'lib/logger';
import Statement from 'lib/models/statement';
import statementHandler from 'worker/handlers/statement/statementHandler';
import { getOptions, withRedisClient } from 'lib/connections/redis';
import Redis from 'ioredis';
import cachePrefix from 'lib/helpers/cachePrefix';

export default async () => {
  const redisOpts = getOptions();
  const subKey = cachePrefix('statement.notify'); // subscribe channel is not prefixed by bull, so must manually do this!
  const pubKey = cachePrefix('statement.new');
  
  logger.debug('Using redis options:', redisOpts);
  logger.info(`Subscribing to '${subKey}' and will rpop on key '${pubKey}'`);
  
  let currentlyWorking = false;
  
  // Create dedicated clients for pub/sub that won't be returned to the pool
  // since subscription clients need to maintain their connection
  const subClient = await withRedisClient(async (client) => {
    // Create a new dedicated client with the same configuration
    const options = getOptions();
    const subClient = new Redis(options);
    
    // Set up error handling
    subClient.on('error', (err) => {
      logger.error('Redis subscription client error', err);
      // Attempt to reconnect
      setTimeout(() => {
        logger.info('Attempting to reconnect subscription client...');
        try {
          subClient.subscribe(subKey);
        } catch (e) {
          logger.error('Failed to reconnect subscription client', e);
        }
      }, 5000);
    });
    
    subClient.on('message', async (channel) => {
      logger.debug(`Message on channel '${channel}'`);
      if (!currentlyWorking) {
        currentlyWorking = true;
        let latestResult = null;
        
        // while there are payloads left in the work queue, process them
        async.doUntil(
          async (cb) => {
            try {
              // Use the pool for each RPOP operation
              await withRedisClient(async (pubClient) => {
                const payload = await pubClient.rpop(pubKey);
                latestResult = payload;
                
                if (payload) {
                  logger.debug(`Popped '${pubKey}':`, payload);
                  const { statementId } = JSON.parse(payload);
                  
                  // Find the statement and process it
                  const statement = await Statement.findOne({ 'statement.id': statementId });
                  if (statement) {
                    statementHandler({ statementId: statement._id });
                  } else {
                    logger.warn(`Statement not found for ID: ${statementId}`);
                  }
                }
              });
              cb();
            } catch (err) {
              logger.error('ERROR PROCESSING REDIS MESSAGE', err);
              cb(err);
            }
          },
          () => !latestResult,
          () => {
            currentlyWorking = false;
          }
        );
      }
    });
    
    // Subscribe to the channel
    await subClient.subscribe(subKey);
    
    return subClient;
  });
  
  // Return a function to clean up resources if needed
  return {
    close: async () => {
      try {
        if (subClient) {
          await subClient.quit();
        }
      } catch (err) {
        logger.error('Error closing Redis subscription client', err);
      }
    }
  };
};