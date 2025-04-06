import Redis from 'ioredis';
import logger from 'lib/logger';
import defaultTo from 'lodash/defaultTo';

const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_IDLE_TIMEOUT_MS = 30000; // 30 seconds

/**
 * @returns {string|object} options for ioredis or sentinel
 */
export const getOptions = () => {
  const eventsRepo = defaultTo(process.env.EVENTS_REPO, 'redis');
  switch (eventsRepo) {
    case 'sentinel': {
      const db = defaultTo(Number(process.env.SENTINEL_DB), 0);
      const password = process.env.SENTINEL_PASSWORD;
      const name = defaultTo(process.env.SENTINEL_NAME, 'mymaster');
      const connections = defaultTo(process.env.SENTINEL_CONNECTIONS, '127.0.0.1:6379');
      const sentinels = connections.split(' ').map((conn) => {
        const [host, port] = conn.split(':');
        return { host, port: defaultTo(Number(port), DEFAULT_REDIS_PORT) };
      });
      return { db, password, name, sentinels };
    }
    default: case 'redis': {
      if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
      }
      const db = defaultTo(Number(process.env.REDIS_DB), 0);
      const password = process.env.REDIS_PASSWORD;
      const host = process.env.REDIS_HOST;
      const port = defaultTo(Number(process.env.REDIS_PORT), DEFAULT_REDIS_PORT);
      return { db, password, host, port };
    }
  }
};

class RedisPool {
  constructor() {
    this.clients = new Set();
    this.availableClients = new Set();
    this.idleTimeout = defaultTo(Number(process.env.REDIS_IDLE_TIMEOUT_MS), DEFAULT_IDLE_TIMEOUT_MS);
    this.cleanupInterval = setInterval(() => this.cleanup(), this.idleTimeout);
  }

  async createClient() {
    try {
      const options = getOptions();
      logger.info('Creating Redis client');
      logger.silly('Creating Redis client', options);
      const client = new Redis(options);
      
      // Set up error handling
      client.on('error', (err) => {
        logger.error('Redis client error', err);
        this.removeClient(client);
      });
      
      return client;
    } catch (e) {
      logger.error("Couldn't connect to redis", e);
      throw e;
    }
  }

  async acquire() {
    // Try to get an available client first
    for (const client of this.availableClients) {
      try {
        await client.ping();
        this.availableClients.delete(client);
        return client;
      } catch (e) {
        // Client is not valid, remove it
        this.removeClient(client);
      }
    }

    // No available clients, create a new one
    const client = await this.createClient();
    this.clients.add(client);
    return client;
  }

  async release(client) {
    if (!this.clients.has(client)) {
      return;
    }

    try {
      await client.ping();
      this.availableClients.add(client);
      
      // Set up timeout to remove idle client
      setTimeout(() => {
        if (this.availableClients.has(client)) {
          this.removeClient(client);
        }
      }, this.idleTimeout);
    } catch (e) {
      this.removeClient(client);
    }
  }

  removeClient(client) {
    this.clients.delete(client);
    this.availableClients.delete(client);
    try {
      client.quit();
    } catch (e) {
      logger.error('Error destroying Redis client', e);
    }
  }

  cleanup() {
    const now = Date.now();
    for (const client of this.availableClients) {
      if (now - client.lastUsed > this.idleTimeout) {
        this.removeClient(client);
      }
    }
  }

  async close() {
    clearInterval(this.cleanupInterval);
    for (const client of this.clients) {
      this.removeClient(client);
    }
  }
}

let redisPool;

export const getRedisPool = () => {
  if (!redisPool) {
    redisPool = new RedisPool();
  }
  return redisPool;
};

export const withRedisClient = async (operation) => {
  const pool = getRedisPool();
  const client = await pool.acquire();
  try {
    return await operation(client);
  } finally {
    await pool.release(client);
  }
};

export const createClient = async () => {
  const pool = getRedisPool();
  return pool.acquire();
};

export const releaseClient = async (client) => {
  const pool = getRedisPool();
  return pool.release(client);
};

export const closePool = async () => {
  if (redisPool) {
    await redisPool.close();
    redisPool = null;
  }
};