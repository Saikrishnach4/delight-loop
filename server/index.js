const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../my-app/build')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delight-loop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize Redis and queue manager
const { testConnection: testRedisConnection } = require('./config/redis');
const queueManager = require('./services/queueManager');

// Test email service and Redis on startup
const emailService = require('./services/emailService');
const emailCampaignEngine = require('./services/emailCampaignEngine');

const initializeServices = async () => {
  try {
    console.log('🔧 Initializing services...');
    
    // Test Redis connection with retry
    let redisConnected = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!redisConnected && retryCount < maxRetries) {
      try {
        redisConnected = await testRedisConnection();
        if (redisConnected) {
          console.log('✅ Redis is ready');
        } else {
          console.log(`⚠️ Redis connection attempt ${retryCount + 1} failed, retrying...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`⚠️ Redis connection error (attempt ${retryCount + 1}):`, error.message);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!redisConnected) {
      console.log('❌ Redis connection failed after multiple attempts');
      console.log('Please check your REDIS_URL in .env file');
      console.log('Server will continue without Redis (triggers may not work)');
    }

    // Test email service
    const emailConnected = await emailService.verifyConnection();
    if (emailConnected) {
      console.log('✅ Email service is ready and connected');
      
      // Start the BullMQ-based trigger system
      emailCampaignEngine.startTimeTriggerChecking();
      console.log('⏰ BullMQ-based trigger system started');
      
      // Clean up old jobs on startup (optional) - don't fail if this doesn't work
      try {
        await queueManager.cleanupJobs();
      } catch (error) {
        console.log('⚠️ Cleanup jobs warning:', error.message);
      }
      
    } else {
      console.log('❌ Email service is not configured properly');
      console.log('Please check your EMAIL_USER and EMAIL_PASS in .env file');
    }
    
    console.log('🎉 Service initialization completed');
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
  }
};

// Initialize services after a short delay
setTimeout(initializeServices, 1000);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/widgets', require('./routes/widgets'));
app.use('/api/collaboration', require('./routes/collaboration'));

// Socket.IO for real-time collaboration
require('./socket/collaboration')(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await queueManager.gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await queueManager.gracefulShutdown();
  process.exit(0);
}); 