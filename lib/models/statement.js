/* eslint-disable import/no-mutable-exports */
import mongoose from 'mongoose';
import { getConnection } from 'lib/connections/mongoose';
import moment from 'moment';
import sha1 from 'sha1';
import defaultTo from 'lodash/defaultTo';
import boolean from 'boolean';
import Promise, { delay } from 'bluebird'; // Bluebird Promise is still used for delay
import keys from 'lodash/keys';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import mapKeys from 'lodash/mapKeys';
import removeEmptyMatch from 'lib/helpers/removeEmptyMatch';
import scopeChecks from 'lib/models/plugins/scopeChecks';
import * as scopes from 'lib/constants/scopes';
import cachePrefix from 'lib/helpers/cachePrefix';
import addCRUDFunctions from 'lib/models/plugins/addCRUDFunctions';
import * as redis from 'lib/connections/redis'; // Correctly import our redis module
import parseQuery from 'lib/helpers/parseQuery';
import getOrgFromAuthInfo from 'lib/services/auth/authInfoSelectors/getOrgFromAuthInfo';
import getScopeFilter from 'lib/services/auth/filters/getScopeFilter';
import filterByOrg from 'lib/models/plugins/filterByOrg';
import decodeDot from 'lib/helpers/decodeDot';
import logger from 'lib/logger';
import Lrs from 'lib/models/lrs';

// Constants remain the same
const ALLOW_AGGREGATION_DISK_USE = boolean(defaultTo(process.env.ALLOW_AGGREGATION_DISK_USE, true));
const AGGREGATION_CACHE_SECONDS = defaultTo(Number(process.env.AGGREGATION_CACHE_SECONDS), 300);
const AGGREGATION_REFRESH_AT_SECONDS = defaultTo(Number(process.env.AGGREGATION_REFRESH_AT_SECONDS), 120);
const ASYNC_AGGREGATION_WAITING_MS = defaultTo(Number(process.env.ASYNC_AGGREGATION_WAITING_MS), 0);
const ASYNC_AGGREGATION_CACHE_SECONDS = defaultTo(Number(process.env.ASYNC_AGGREGATION_CACHE_SECONDS), 604800); // 7 days
const ASYNC_AGGREGATION_TIMEOUT_MS = defaultTo(Number(process.env.ASYNC_AGGREGATION_TIMEOUT_MS), 0);
const ASYNC_AGGREGATION_REFRESH_AFTER_SECONDS = defaultTo(Number(process.env.ASYNC_AGGREGATION_REFRESH_AFTER_SECONDS), 60); // 1 minute
const MAX_TIME_MS = defaultTo(Number(process.env.MAX_TIME_MS), 0);

let Statement;
const schema = new mongoose.Schema({
  // Schema remains the same
  lrs: { type: mongoose.Schema.Types.Mixed },
  organisation: { type: mongoose.Schema.ObjectId, ref: 'Organisation' },
  lrs_id: { type: mongoose.Schema.ObjectId, ref: 'Lrs' },
  person: { _id: { type: mongoose.Schema.ObjectId, ref: 'Persona' }, display: { type: String } },
  personaIdentifier: { type: mongoose.Schema.ObjectId, ref: 'PersonaIdentifier' },
  active: { type: Boolean },
  voided: { type: Boolean },
  timestamp: { type: Date },
  stored: { type: Date },
  refs: { type: mongoose.Schema.Types.Mixed },
  statement: { type: mongoose.Schema.Types.Mixed },
  client_id: { type: mongoose.Schema.Types.String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  completedQueues: [{ type: String }],
  processingQueues: [{ type: String }],
  deadForwardingQueue: [{ type: mongoose.Schema.ObjectId, ref: 'StatementForwarding' }],
  failedForwardingLog: [{
    statementForwarding_id: { type: mongoose.Schema.ObjectId, ref: 'StatementForwarding' },
    timestamp: Date,
    message: String,
    errorInfo: Object,
  }],
  pendingForwardingQueue: [{ type: mongoose.Schema.ObjectId, ref: 'StatementForwarding' }],
  completedForwardingQueue: [{ type: mongoose.Schema.ObjectId, ref: 'StatementForwarding' }],
  hash: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

// Indexes and plugins remain the same
schema.index({ organisation: 1, timestamp: -1, _id: 1 });
schema.readScopes = keys(scopes.USER_SCOPES).concat([
  scopes.XAPI_ALL,
  scopes.XAPI_READ,
  scopes.XAPI_STATEMENTS_READ,
  scopes.XAPI_STATEMENTS_READ_MINE,
]);
schema.writeScopes = keys(scopes.USER_SCOPES).concat([
  scopes.XAPI_ALL,
  scopes.XAPI_STATEMENTS_WRITE,
]);
schema.plugin(scopeChecks);
schema.plugin(filterByOrg);
schema.plugin(addCRUDFunctions);

schema.post('remove', async (statement, next) => {
  // Logic here remains the same
  try {
      await Lrs.decrementStatementCount(statement.lrs_id);
      next();
  } catch (err) {
      logger.error(`Error decrementing statement count for LRS ${statement.lrs_id}`, err);
      // Continue even with error here to not block the deletion process
      next();
  }
});

// streamAggregation remains the same, it doesn't interact directly with Redis here
const streamAggregation = ({ pipeline, skip, limit, batchSize, maxTimeMS }) => {
  let query = Statement
    .aggregate(pipeline)
    .read('secondaryPreferred')
    .allowDiskUse(ALLOW_AGGREGATION_DISK_USE);
  if (skip !== -1) query = query.skip(skip);
  if (limit !== -1) query = query.limit(limit);
  if (!query.options) {
    query.options = {};
  }
  // Ensure maxTimeMS is set correctly, even if it's 0 (which means no limit)
  if (maxTimeMS > 0) {
      query.options.maxTimeMS = maxTimeMS;
  } else if (query.options.maxTimeMS) {
      // If it's 0 but already exists in options, remove it to have no limit
      delete query.options.maxTimeMS;
  }

  return Promise.resolve(query
    .cursor({ batchSize })
    .exec()
  );
};

// getCachedAggregation remains the same
const getCachedAggregation = ({ client, key }) => client.get(key);

// streamToStringResult remains the same
const streamToStringResult = (stream) => {
  let firstItem = true;
  let writingDocs = false;
  let result = '';

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('data', (doc) => {
      if (firstItem) {
        firstItem = false;
        writingDocs = true;
        result += '[';
      } else {
        result += ',';
      }
      // Apply postFetchMap before JSON.stringify
      result += JSON.stringify(Statement.postFetchMap(doc));
    });
    stream.on('end', () => {
      result += writingDocs ? ']' : '[]';
      resolve(result);
    });
  });
};

// setCachedAggregation is rewritten with async/await and try/finally
const setCachedAggregation = async ({ client, dataKey, isRunningKey, stream }) => {
  try {
    const result = await streamToStringResult(stream);
    // Use pipeline for atomicity (although not critical here) and efficiency
    const pipeline = client.pipeline();
    pipeline.setex(dataKey, AGGREGATION_CACHE_SECONDS, result);
    pipeline.del(isRunningKey); // Delete lock only on success
    await pipeline.exec();
    return result;
  } catch (err) {
    // On error during stream/write, delete the lock to allow new attempt
    logger.error(`Error during setCachedAggregation for key ${dataKey}:`, err);
    try {
      await client.del(isRunningKey);
    } catch (delErr) {
      logger.error(`Failed to delete running key ${isRunningKey} after error:`, delErr);
    }
    throw err; // Forward the original error
  }
};

/**
 * Returns a cursor or cached result from aggregation on statements collection,
 * filtered by user permissions.
 * Modernized to use async/await and withRedisClient.
 */
schema.statics.aggregateByAuth = async function aggregateByAuth( // Now async, doesn't accept cb
  authInfo,
  pipeline = [],
  {
    skip = 0,
    limit = -1,
    cache = false,
    batchSize = 100,
    getStream = false,
    maxTimeMS = MAX_TIME_MS,
    sampleSize = undefined
  } = {} // Add default value for options
) {
  // parseQuery and permission filtering remain the same
  const parsedPipeline = await parseQuery(pipeline, { authInfo });
  const modelName = 'statement';
  const actionName = 'view';
  const scopedFilter = await getScopeFilter({
    modelName,
    actionName,
    authInfo,
    allowDashboardAccess: true
  });
  const organisation = getOrgFromAuthInfo(authInfo);

  parsedPipeline.unshift({
    $match: scopedFilter
  });

  if (sampleSize > 0) {
    parsedPipeline.unshift({ $sample: { size: sampleSize } });
  }
  const finalPipeline = removeEmptyMatch(parsedPipeline);

  // If only stream is requested, return it directly
  if (getStream) {
    const stream = await streamAggregation({
      pipeline: finalPipeline,
      skip,
      limit,
      batchSize,
      maxTimeMS,
    });
    return stream; // Return stream directly
  }

  // If caching is disabled, execute aggregation and return result as string
  if (cache === false) {
    const stream = await streamAggregation({
      pipeline: finalPipeline, skip, limit, batchSize, maxTimeMS
    });
    const result = await streamToStringResult(stream);
    return result; // Return the result
  }

  // Caching logic using withRedisClient
  return redis.withRedisClient(async (redisClient) => {
    const redisKey = cachePrefix(`${organisation}-AGGREGATION-${sha1(JSON.stringify(finalPipeline))}-${skip}-${limit}`);
    const dataKey = `${redisKey}-DATA`;
    const isRunningKey = `${redisKey}-RUNNING`;

    const dataKeyTTL = await redisClient.ttl(dataKey);
    let cachedResult = null;
    let shouldRefresh = false;

    // Check if there's fresh cache
    if (dataKeyTTL >= 5) {
      cachedResult = await getCachedAggregation({ client: redisClient, key: dataKey });
    }

    // Check if cache is old and needs refresh
    if (dataKeyTTL <= AGGREGATION_REFRESH_AT_SECONDS) {
      shouldRefresh = true;
    }

    // If we have fresh cache and don't need to refresh, return cache
    if (cachedResult !== null && !shouldRefresh) {
      logger.debug(`Cache hit for ${dataKey}`);
      return cachedResult;
    }

    // If we need to refresh or no cache
    if (shouldRefresh || cachedResult === null) {
      // Try to acquire refresh lock (stale-while-revalidate)
      const lockAcquired = await redisClient.set(isRunningKey, 1, 'EX', 300, 'NX');

      if (lockAcquired === 'OK') {
        logger.debug(`Cache miss or stale for ${dataKey}. Lock acquired, refreshing...`);
        // If we got the lock, start aggregation and caching
        try {
          const stream = await streamAggregation({
            pipeline: finalPipeline, skip, limit, batchSize, maxTimeMS // Pass maxTimeMS here too
          });
          // setCachedAggregation now handles isRunningKey deletion on success/error
          const freshResult = await setCachedAggregation({ client: redisClient, dataKey, isRunningKey, stream });
          return freshResult;
        } catch (error) {
           logger.error(`Error refreshing cache for ${dataKey}:`, error);
           // If we have old cache, return it, otherwise throw error
           if (cachedResult !== null) {
               logger.warn(`Returning stale cache for ${dataKey} due to refresh error.`);
               return cachedResult;
           } else {
               throw error; // No cache, forward the error
           }
        }
      } else {
        // If lock not acquired (another process is refreshing)
        logger.debug(`Cache miss or stale for ${dataKey}, but refresh is already running. Waiting or returning stale.`);
        // If we have old cache, return it (stale-while-revalidate)
        if (cachedResult !== null) {
          return cachedResult;
        } else {
          // If we have no cache at all, we need to wait a bit and try again
          // This is more complex, for now just throw error or return empty result
          // For simplicity, we'll wait a bit and check cache again
          await delay(200); // Wait 200ms
          const potentiallyNewResult = await getCachedAggregation({ client: redisClient, key: dataKey });
          if (potentiallyNewResult !== null) {
              return potentiallyNewResult;
          } else {
              // If still nothing, might need more complex logic or return error
              logger.error(`Cache for ${dataKey} could not be retrieved after waiting.`);
              throw new Error(`Cache could not be retrieved for ${dataKey}`);
          }
        }
      }
    }
    // This line should not be reached in normal logic, but just in case
    throw new Error('Unexpected state in aggregateByAuth cache logic');
  });
};

// mapDot and postFetchMap remain the same
export const mapDot = (data, converter = decodeDot) => {
  if (isPlainObject(data)) {
    const mappedData = mapKeys(data, (value, key) => converter(key));
    return mapValues(mappedData, val => mapDot(val, converter));
  }
  if (isArray(data)) {
    return data.map(val => mapDot(val, converter));
  }
  return data;
};
schema.statics.postFetchMap = function postFetchMap(statement) {
  // Ensure statement.statement exists before mapping it
  if (statement && statement.statement) {
      statement.statement = mapDot(statement.statement);
  }
  return statement;
};

// buildRedisKeyPrefix remains the same
export const buildRedisKeyPrefix = (organisationId, pipeline, skip, limit) =>
  cachePrefix(`${organisationId}-AGGREGATION-ASYNC-${sha1(JSON.stringify(pipeline))}-${skip}-${limit}`);

/**
 * Executes aggregation asynchronously in background mode.
 * Modernized to use withRedisClient internally.
 */
export const runAggregationAsync = async ( // Removed redisClient parameter
  organisationId,
  pipeline,
  skip,
  limit,
) => {
  const prefix = buildRedisKeyPrefix(organisationId, pipeline, skip, limit);
  let isRunningInterval = null; // Declare outside try to be accessible in finally

  // Function to refresh lock using withRedisClient
  const setIsRunning = async () => {
    try {
      await redis.withRedisClient(async (client) => {
        // Extend lock life by another 10 seconds
        await client.setex(`${prefix}-QUERY-RUNNING`, 10, 1);
      });
    } catch (err) {
      logger.error(`Failed to refresh async aggregation lock for ${prefix}:`, err);
      // If we can't refresh the lock, maybe we should stop the interval?
      // For now just log.
    }
  };

  try {
    // Record start time with withRedisClient
    await redis.withRedisClient(async (client) => {
      await client.set(`${prefix}-STARTED-AT`, moment().toISOString()); // Use ISO format
    });

    // Set initial lock with withRedisClient
    await setIsRunning(); // Call once to create it
    isRunningInterval = setInterval(setIsRunning, 5000); // Start interval

    // Execute the aggregation itself (this can take a long time)
    const stream = await streamAggregation({
      pipeline,
      skip,
      limit,
      batchSize: 100, // Can be configured
      maxTimeMS: ASYNC_AGGREGATION_TIMEOUT_MS,
    });
    const results = await streamToStringResult(stream);

    // On success, write results and statuses with withRedisClient
    await redis.withRedisClient(async (client) => {
        const startedAt = await client.get(`${prefix}-STARTED-AT`); // Get recorded start time
        const completedAt = moment().toISOString(); // ISO format

        // Use pipeline for atomicity and efficiency
        const pipeline = client.pipeline();
        // Rewrite STARTED-AT with same value but long TTL
        if (startedAt) { // Only if we found it
             pipeline.setex(`${prefix}-STARTED-AT`, ASYNC_AGGREGATION_CACHE_SECONDS, startedAt);
        }
        pipeline.setex(`${prefix}-COMPLETED-AT`, ASYNC_AGGREGATION_CACHE_SECONDS, completedAt);
        pipeline.setex(`${prefix}-RESULTS`, ASYNC_AGGREGATION_CACHE_SECONDS, results);
        await pipeline.exec();
        logger.info(`Async aggregation for prefix ${prefix} completed successfully.`);
    });

  } catch (err) {
    logger.error(`Error during async aggregation for prefix ${prefix}:`, err);
    // On error, delete all related keys with withRedisClient
    try {
      await redis.withRedisClient(async (client) => {
        const pipeline = client.pipeline();
        pipeline.del(`${prefix}-STARTED-AT`);
        pipeline.del(`${prefix}-COMPLETED-AT`);
        pipeline.del(`${prefix}-RESULTS`);
        // Lock QUERY-RUNNING will be deleted in finally
        await pipeline.exec();
      });
    } catch (cleanupErr) {
      logger.error(`Failed to cleanup Redis keys for prefix ${prefix} after error:`, cleanupErr);
    }
  } finally {
    // Guaranteed to stop interval and delete lock
    if (isRunningInterval) {
      clearInterval(isRunningInterval);
    }
    try {
      await redis.withRedisClient(async (client) => {
        await client.del(`${prefix}-QUERY-RUNNING`);
      });
    } catch (finalDelErr) {
      logger.error(`Failed to delete final running key ${prefix}-QUERY-RUNNING:`, finalDelErr);
    }
  }
};

/**
 * Checks the status of asynchronous aggregation.
 * Modernized to use withRedisClient internally.
 */
export const getAggregationStatus = async (prefix, sinceAt) => { // Removed redisClient parameter
  return redis.withRedisClient(async (redisClient) => {
    const [startedAt, completedAt, results, isRunning] = await Promise.all([
      redisClient.get(`${prefix}-STARTED-AT`),
      redisClient.get(`${prefix}-COMPLETED-AT`),
      redisClient.get(`${prefix}-RESULTS`),
      redisClient.get(`${prefix}-QUERY-RUNNING`).then(res => boolean(res)), // Check if key exists
    ]);

    // Use ISO format for comparison
    if (sinceAt && completedAt && moment(completedAt).isSameOrBefore(moment(sinceAt))) {
      return {
        result: null,
        startedAt,
        completedAt: null,
        isRunning,
      };
    }

    return {
      result: results ? JSON.parse(results) : null, // Safer parsing
      startedAt,
      completedAt,
      isRunning,
    };
  });
};

// decoratePipeline remains the same
export const decoratePipeline = async (pipeline, authInfo, allowDashboardAccess) => {
  const parsedPipeline = await parseQuery(pipeline, { authInfo });
  const scopedFilter = await getScopeFilter({
    modelName: 'statement',
    actionName: 'view',
    authInfo,
    allowDashboardAccess
  });
  parsedPipeline.unshift({
    $match: scopedFilter
  });
  return removeEmptyMatch(parsedPipeline);
};

// hasFreshCache remains the same
const hasFreshCache = (completedAt) => {
  if (!completedAt) {
    return false;
  }
  // Use ISO format
  const cacheExpiryTime = moment(completedAt).add(ASYNC_AGGREGATION_REFRESH_AFTER_SECONDS, 'seconds');
  return moment().isSameOrBefore(cacheExpiryTime);
};

/**
 * Main function for starting and checking asynchronous aggregation.
 * Modernized to use withRedisClient internally.
 */
export const aggregateAsync = async (
  authInfo,
  basePipeline,
  skip,
  limit,
  sinceAt,
) => {
  const organisationId = getOrgFromAuthInfo(authInfo);
  // Generate pipeline once
  const pipeline = await decoratePipeline(basePipeline, authInfo, true);
  const prefix = buildRedisKeyPrefix(organisationId, pipeline, skip, limit);

  // Check status with withRedisClient
  const status = await getAggregationStatus(prefix, sinceAt); // No longer pass redisClient
  const { completedAt, isRunning } = status;

  // If running or cache is fresh, return current status
  if (isRunning || hasFreshCache(completedAt)) {
    return status;
  }

  // If not running and cache not fresh, start runAggregationAsync
  // Don't await it as it's a background task
  runAggregationAsync(organisationId, pipeline, skip, limit)
      .catch(err => {
          // Good to log error even if it's fire-and-forget
          logger.error(`Background runAggregationAsync failed for prefix ${prefix}:`, err);
      });

  // Wait optional time
  if (ASYNC_AGGREGATION_WAITING_MS > 0) {
      await delay(ASYNC_AGGREGATION_WAITING_MS);
  }

  // Return status immediately after start (or after waiting)
  // Client should check again later
  // Use data from first check because runAggregationAsync might not be done
  // or we could return new status if we waited long enough? Safer to return
  // status right after start. If we want more current, need to call getAggregationStatus again.
  // Let's call it again after delay for more current information.
  const delayedStatus = await getAggregationStatus(prefix, sinceAt);
  return delayedStatus;
};

// Set static method
schema.statics.aggregateAsync = aggregateAsync;

// Export remains the same
export { schema };
Statement = getConnection().model('Statement', schema, 'statements');
export default Statement;
