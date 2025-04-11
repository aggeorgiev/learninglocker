import logger from 'lib/logger';
import { withRedisClient } from 'lib/connections/redis';
import cachePrefix from 'lib/helpers/cachePrefix';
import async from 'async';
import { promisify } from 'util';

// Convert async.each to Promise-based version
const asyncEachPromise = promisify(async.each);

/**
 * Clears cache keys with a given prefix using the Redis connection pool
 * @param {string} prefix - The prefix to match for deletion
 * @returns {Promise<{total: number}>} - Result object with total keys deleted
 */
const clearPrefix = async (prefix) => {
  logger.info(`Clearing cache keys starting with "${prefix}"`);
  
  try {
    // Get all matching keys using the Redis pool
    const rows = await withRedisClient(client => client.keys(`${prefix}*`));
    
    // Delete each key using the Redis pool
    await asyncEachPromise(rows, async (row) => {
      await withRedisClient(client => client.del(row));
    });
    
    return { total: rows.length };
  } catch (error) {
    logger.error(`Error clearing cache keys: ${error.message}`, error);
    throw error;
  }
};

/**
 * Clear aggregation cache for a specific organization or all organizations
 * @param {Object} options - Options object
 * @param {string} [options.orgId] - Optional organization ID to limit clearing
 * @param {boolean} [options.exitProcess=true] - Whether to exit the process when done
 * @returns {Promise<{total: number}>} - Result with total keys deleted
 */
export default async function clearAggregationCache(options = {}) {
  const { orgId, exitProcess = true } = options;
  
  let aggregationPrefix;
  if (orgId) {
    aggregationPrefix = cachePrefix(`${orgId}-AGGREGATION-*`);
  } else {
    aggregationPrefix = cachePrefix('*-AGGREGATION-*');
  }
  
  try {
    const result = await clearPrefix(aggregationPrefix);
    logger.info(`Cleared ${result.total} keys`);
    
    if (exitProcess) {
      process.exit();
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to clear aggregation cache', error);
    if (exitProcess) {
      process.exit(1);
    }
    throw error;
  }
}