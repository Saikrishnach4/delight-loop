const Redis = require('ioredis');
require('dotenv').config();

// Parse Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 30000, // Increased from 10000
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 30000, // Increased from 10000
  commandTimeout: 30000, // Increased from 5000 to 30 seconds
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: true, // Allow commands to queue while connecting
  retryDelayOnFailover: 1000, // Increased retry delay
  maxRetriesPerRequest: null, // Required by BullMQ
  family: 4, // Force IPv4
  db: 0, // Use default database
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('🔗 Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  // Don't log the full error stack to reduce noise
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', (delay) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms...`);
});

redis.on('end', () => {
  console.log('🔚 Redis connection ended');
});

// Add timeout handling
redis.on('timeout', () => {
  console.log('⏰ Redis connection timeout - attempting to reconnect...');
});

// Test Redis connection
const testConnection = async () => {
  try {
    await redis.ping();
    console.log('🏓 Redis ping successful');
    return true;
  } catch (error) {
    console.error('❌ Redis ping failed:', error);
    return false;
  }
};

module.exports = {
  redis,
  testConnection
}; 