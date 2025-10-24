const redis = require('redis');

// Create Redis client with connection settings optimized for Docker
const client = redis.createClient({
  socket: {
    host: 'redis', // Service name from Docker Compose (container name)
    port: 6379,
    // Reconnection strategy with exponential backoff
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnection attempt: ${retries}`);
      return Math.min(retries * 100, 3000);
    }
  }
});

// Event handlers for connection monitoring
client.on('error', (err) => console.log('❌ Redis Client Error:', err.message));
client.on('connect', () => console.log('🔗 Connecting to Redis...'));
client.on('ready', () => console.log('✅ Connected to Redis successfully!'));
client.on('reconnecting', () => console.log('🔄 Reconnecting to Redis...'));
client.on('end', () => console.log('🔴 Redis connection closed'));

// Connection function with error handling
const connectRedis = async () => {
  try {
    await client.connect();
    console.log('🚀 Redis client connected and ready for operations');
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
    // Application will continue running and health checks will handle reconnection
  }
};

// Initialize connection
connectRedis();

module.exports = client;