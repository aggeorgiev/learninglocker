import logger from 'lib/logger';
import * as redis from 'lib/connections/redis'; // Using the defined redis.js
import cachePrefix from 'lib/helpers/cachePrefix';
// Note: The 'async' library is no longer needed as we use native async/await and pipeline.

/**
 * Asynchronously clears all Redis keys starting with a given prefix.
 * Uses SCAN instead of KEYS for production safety.
 * Uses Pipelining for efficient deletion.
 *
 * @param {string} prefix - The prefix of keys to delete (will append '*' at the end).
 * @returns {Promise<number>} Promise that resolves with the count of deleted keys.
 */
const clearPrefix = async (prefix) => {
  // We use withRedisClient for safe management of the connection from the pool
  return redis.withRedisClient(async (redisClient) => {
    logger.info(`Scanning for cache keys starting with "${prefix}"`);
    const scanStream = redisClient.scanStream({
      match: `${prefix}*`, // Search pattern
      count: 100, // Number of keys to retrieve in one iteration (optimization)
    });

    const keysToDelete = [];
    // Iterate asynchronously through the stream of keys returned by SCAN
    for await (const keysChunk of scanStream) {
      if (keysChunk.length > 0) {
        keysToDelete.push(...keysChunk);
      }
    }

    if (keysToDelete.length === 0) {
      logger.info(`No keys found with prefix "${prefix}" to delete.`);
      return 0; // Return 0 if no keys are found
    }

    logger.info(`Found ${keysToDelete.length} keys with prefix "${prefix}". Preparing to delete...`);

    // We use Pipelining to group all DEL commands into one network request
    const pipeline = redisClient.pipeline();
    keysToDelete.forEach((key) => {
      pipeline.del(key); // Add DEL command for each key to the pipeline
    });

    // Execute the pipeline
    // The result is an array where each element corresponds to the result of the corresponding command in the pipeline.
    // For DEL, the result is the count of deleted keys (1 if the key existed, 0 if it didn't).
    const results = await pipeline.exec();

    // Count how many DEL commands returned 1 (successful deletion)
    // results is an array of arrays [[err, result], [err, result], ...]
    const deletedCount = results.reduce((count, [err, result]) => {
      // Count only successful operations (err is null) and where result is 1
      return err === null && result === 1 ? count + 1 : count;
    }, 0);

    logger.info(`Successfully deleted ${deletedCount} keys with prefix "${prefix}".`);
    return deletedCount; // Return the actual count of deleted keys
  });
};

/**
 * Main function of the script.
 * Determines the prefix and calls clearPrefix.
 * Handles the result and exit code of the process.
 */
export default async function (options) {
  const orgId = options.orgId || false;
  let aggregationPrefix;
  if (orgId) {
    aggregationPrefix = cachePrefix(`${orgId}-AGGREGATION-`); // Removed '*' from here, clearPrefix adds it
  } else {
    aggregationPrefix = cachePrefix('*-AGGREGATION-'); // Removed '*' from here
  }

  try {
    const deletedCount = await clearPrefix(aggregationPrefix);
    logger.info(`Cache clearing process finished. Total keys deleted: ${deletedCount}`);
    process.exit(0); // Successful exit
  } catch (error) {
    logger.error(`Error during cache clearing process for prefix "${aggregationPrefix}":`, error);
    process.exit(1); // Exit with error
  }
}
