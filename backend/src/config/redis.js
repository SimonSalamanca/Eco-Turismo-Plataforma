const Redis = require('ioredis');
const env = require('./env');

const isRedisConfigured = env.redis.url && env.redis.url !== 'redis://localhost:6379' && env.redis.url !== 'redis://redis:6379';

let redis;

if (isRedisConfigured) {
  redis = new Redis(env.redis.url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.warn('⚠️ Redis connection error (non-critical):', err.message);
  });
} else {
  console.log('⚠️ Redis not configured - caching disabled');
  redis = {
    connect: async () => {},
    get: async () => null,
    setex: async () => true,
    del: async () => true,
    keys: async () => [],
    ping: async () => { throw new Error('Redis not configured'); }
  };
}

const cacheGet = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error.message);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error.message);
    return false;
  }
};

const cacheDelete = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis DELETE error:', error.message);
    return false;
  }
};

const cacheDeletePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Redis DELETE pattern error:', error.message);
    return false;
  }
};

const connectRedis = async () => {
  await redis.connect();
};

module.exports = {
  redis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  connectRedis
};