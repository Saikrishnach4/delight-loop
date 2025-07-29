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

// Test email service on startup
const emailService = require('./services/emailService');
setTimeout(() => {
  emailService.verifyConnection()
    .then(isConnected => {
      if (isConnected) {
        console.log('✅ Email service is ready and connected');
      } else {
        console.log('❌ Email service is not configured properly');
        console.log('Please check your EMAIL_USER and EMAIL_PASS in .env file');
      }
    })
    .catch(err => {
      console.error('Email service verification failed:', err);
    });
}, 1000); // Wait 1 second for transporter to initialize

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