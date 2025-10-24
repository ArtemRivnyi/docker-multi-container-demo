const express = require('express');
const client = require('./redis-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON parsing
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// POST endpoint to set key-value pair in Redis
app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  
  // Validate request body
  if (!key || !value) {
    return res.status(400).json({ 
      error: 'Please provide both "key" and "value" in the JSON body.' 
    });
  }

  try {
    // Store data in Redis
    await client.set(key, value);
    console.log(`✅ Key "${key}" set with value "${value}"`);
    res.json({ status: `Key "${key}" set successfully!` });
  } catch (err) {
    console.error('❌ Redis set error:', err);
    res.status(500).json({ 
      error: 'Failed to set key in Redis', 
      details: err.message 
    });
  }
});

// GET endpoint to retrieve value by key from Redis
app.get('/get/:key', async (req, res) => {
  const { key } = req.params;

  try {
    // Retrieve data from Redis
    const value = await client.get(key);
    if (value === null) {
      console.log(`⚠️ Key "${key}" not found in Redis`);
      return res.status(404).json({ error: `Key "${key}" not found.` });
    }
    console.log(`✅ Key "${key}" retrieved with value "${value}"`);
    res.json({ key, value });
  } catch (err) {
    console.error('❌ Redis get error:', err);
    res.status(500).json({ 
      error: 'Failed to get key from Redis', 
      details: err.message 
    });
  }
});

// Health check endpoint for container orchestration
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Node.js API',
    version: '1.0.0'
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Dockerized Node.js API with Redis!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      set: 'POST /set - Set key-value pair in Redis',
      get: 'GET /get/:key - Get value by key from Redis',
      health: 'GET /health - Service health check'
    },
    documentation: 'See README.md for usage examples'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong on our side. Please try again later.'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ API server is running on port ${PORT}`);
  console.log(`📍 Main endpoint: curl http://localhost:${PORT}`);
  console.log(`📍 Health check: curl http://localhost:${PORT}/health`);
  console.log(`📍 Set example: curl -X POST -H "Content-Type: application/json" -d '{"key":"test","value":"hello"}' http://localhost:${PORT}/set`);
  console.log(`📍 Get example: curl http://localhost:${PORT}/get/test`);
});