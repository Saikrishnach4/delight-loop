# 🚀 Delight Pool - Advanced Email Campaign Engine

A **production-ready, enterprise-grade email campaign system** built with Node.js, React, and Redis/BullMQ for reliable, scalable email automation with intelligent behavior tracking and trigger-based sequences.

## 🎯 **System Overview**

Delight Pool is a **schema-driven, visual email campaign engine** that enables businesses to create sophisticated, multi-step email sequences with intelligent automation based on user behavior, time delays, and purchase tracking.

### **Key Features**
- ✅ **Multi-Step Email Sequences** with behavior-aware triggers
- ✅ **Real-time Analytics** with comprehensive tracking
- ✅ **Purchase Flow Integration** with complete funnel tracking
- ✅ **Redis/BullMQ Job Persistence** for crash recovery
- ✅ **Idle Time & Time Delay Triggers** with pixel tracking
- ✅ **Responsive React UI** with Material-UI components
- ✅ **MongoDB Schema Design** with optimized data structures
- ✅ **RESTful API Architecture** with JWT authentication

## 🏗️ **Architecture**

### **Backend Stack**
```
Node.js + Express.js
├── MongoDB (Mongoose ODM)
├── Redis + BullMQ (Job Queues)
├── JWT Authentication
├── Email Service (SMTP)
└── WebSocket (Real-time updates)
```

### **Frontend Stack**
```
React 18 + Material-UI
├── React Router (SPA Navigation)
├── Context API (State Management)
├── Axios (HTTP Client)
└── Socket.io Client (Real-time)
```

## 📊 **Core System Components**

### **1. Email Campaign Engine**
- **Location**: `server/services/emailCampaignEngine.js`
- **Purpose**: Core business logic for campaign management
- **Key Methods**:
  - `handleUserBehavior()` - Tracks opens, clicks, purchases
  - `scheduleTriggersForManualEmail()` - Sets up automated sequences
  - `getCampaignAnalytics()` - Real-time analytics calculation

### **2. Queue Management System**
- **Location**: `server/services/queueManager.js`
- **Purpose**: Redis/BullMQ job scheduling and processing
- **Features**:
  - Time delay trigger scheduling
  - Idle time trigger management
  - Job persistence and retry logic
  - Worker health monitoring

### **3. Worker Service**
- **Location**: `server/services/workerService.js`
- **Purpose**: Background job processing
- **Capabilities**:
  - Email sending with tracking
  - Behavior trigger processing
  - Analytics updates
  - Error handling and retries

### **4. Email Service**
- **Location**: `server/services/emailService.js`
- **Purpose**: Email composition and delivery
- **Features**:
  - Dynamic purchase button injection
  - Tracking pixel integration
  - Click tracking with URL redirection
  - HTML template processing

## 🎯 **Business Logic Implementation**

### **Purchase Campaign Flow**
```javascript
// 1. Send purchase email with embedded button
await emailService.addTrackingToEmail(content, campaignId, userEmail, baseUrl, campaignData);

// 2. Track purchase page visits via pixel
router.get('/track/purchase-page-visit/:campaignId/:userEmail', async (req, res) => {
  await emailCampaignEngine.handleUserBehavior(campaignId, userEmail, 'purchasePageVisit');
});

// 3. Process purchase completion
router.post('/:id/track-purchase', async (req, res) => {
  await emailCampaignEngine.handleUserBehavior(campaignId, userEmail, 'purchase', purchaseData);
});
```

### **Behavior Trigger System**
```javascript
// Automatic trigger scheduling when emails are sent
async scheduleTriggersForManualEmail(campaignId, recipientEmail, manualEmailIndex) {
  // Time delay triggers
  if (campaign.timeDelayTrigger?.enabled) {
    await queueManager.scheduleTimeDelayTrigger(campaignId, recipientEmail, manualEmailIndex, triggerTime);
  }
  
  // Idle time triggers (if user doesn't visit purchase page)
  if (idleTriggers.length > 0 && (manualEmail.hasLinks || isPurchaseCampaign)) {
    await queueManager.scheduleIdleTimeTrigger(campaignId, recipientEmail, manualEmailIndex, idleTimeMs);
  }
}
```

### **Analytics Engine**
```javascript
// Real-time analytics calculation
const analytics = {
  totalSent: campaign.analytics.totalSent || 0,
  totalOpens: campaign.analytics.totalOpens || 0,
  totalClicks: campaign.analytics.totalClicks || 0,
  totalPurchases: campaign.analytics.totalPurchases || 0,
  openRate: ((totalOpens / totalSent) * 100).toFixed(1),
  clickRate: ((totalClicks / totalSent) * 100).toFixed(1)
};
```

## 🗄️ **Database Schema Design**

### **EmailCampaign Model**
```javascript
const emailCampaignSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: { type: String, enum: ['draft', 'active', 'paused'] },
  
  // Purchase Campaign Configuration
  purchaseCampaignType: { type: String, enum: ['none', 'all', 'selected', 'filtered'] },
  selectedPurchaseRecipients: [String],
  purchaseFilter: Object,
  purchaseLinkText: String,
  purchaseAmount: Number,
  
  // Trigger Configuration
  timeDelayTrigger: {
    enabled: Boolean,
    days: Number,
    hours: Number,
    minutes: Number,
    followUpEmail: Object
  },
  
  behaviorTriggers: [{
    behavior: { type: String, enum: ['open', 'click', 'idle', 'purchase', 'abandonment'] },
    enabled: Boolean,
    idleTime: { enabled: Boolean, minutes: Number },
    followUpEmail: Object
  }],
  
  // Recipients with detailed tracking
  recipients: [{
    email: String,
    name: String,
    status: String,
    lastActivity: Date,
    manualEmails: [{
      sentAt: Date,
      hasLinks: Boolean,
      opened: Boolean,
      clicked: Boolean,
      purchased: Boolean,
      purchaseAmount: Number,
      purchasePageVisited: Boolean,
      timeDelayEmailSent: Boolean,
      idleEmailSent: Boolean
    }]
  }],
  
  // Analytics
  analytics: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    timeDelayTriggersScheduled: { type: Number, default: 0 },
    idleTriggersScheduled: { type: Number, default: 0 },
    timeDelayEmailsSent: { type: Number, default: 0 },
    idleEmailsSent: { type: Number, default: 0 }
  }
});
```

## 🔄 **System Workflows**

### **1. Purchase Campaign Workflow**
```
1. User creates purchase campaign
   ↓
2. Selects recipients (all/selected/filtered)
   ↓
3. Sends purchase emails with embedded buttons
   ↓
4. Schedules time delay & idle triggers
   ↓
5. Tracks user interactions (opens, clicks, page visits)
   ↓
6. Processes purchases and sends thank you emails
   ↓
7. Updates analytics in real-time
```

### **2. Trigger Processing Workflow**
```
1. Email sent → Triggers scheduled in Redis
   ↓
2. Time delay trigger → Waits specified time
   ↓
3. Idle trigger → Waits for user inactivity
   ↓
4. Worker processes trigger → Sends follow-up email
   ↓
5. Analytics updated → UI reflects changes
```

### **3. Behavior Tracking Workflow**
```
1. User opens email → Pixel tracking fires
   ↓
2. handleUserBehavior() processes open
   ↓
3. Campaign analytics updated
   ↓
4. Behavior triggers checked
   ↓
5. Follow-up email sent if configured
```

## 🚀 **Installation & Setup**

### **Prerequisites**
- Node.js 16+
- MongoDB 5+
- Redis 6+
- SMTP server (Gmail, SendGrid, etc.)

### **Environment Configuration**
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/delight-pool
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
BASE_URL=http://localhost:5000
```

### **Installation Steps**
```bash
# Clone repository
git clone https://github.com/your-username/delight-pool.git
cd delight-pool

# Install dependencies
npm install
cd my-app && npm install
cd ../server && npm install

# Start services
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start backend
cd server && npm start

# Terminal 4: Start frontend
cd my-app && npm start
```

## 🧪 **Testing & Quality Assurance**

### **Unit Tests**
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd my-app && npm test
```

### **Integration Tests**
```bash
# Test email sending
npm run test:email

# Test trigger scheduling
npm run test:triggers

# Test analytics calculation
npm run test:analytics
```

### **Performance Testing**
```bash
# Load testing with Artillery
npm run test:load

# Memory usage monitoring
npm run test:memory
```

## 📈 **Performance Optimizations**

### **Database Optimizations**
- Indexed queries on `email` and `campaignId`
- Aggregation pipelines for analytics
- Connection pooling with Mongoose
- Efficient schema design with embedded documents

### **Queue Optimizations**
- Redis connection pooling
- Job batching for bulk operations
- Retry logic with exponential backoff
- Dead letter queue for failed jobs

### **Frontend Optimizations**
- React.memo for component memoization
- Lazy loading for routes
- Debounced API calls
- Optimistic UI updates

## 🔒 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Session management

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens

### **Email Security**
- SPF/DKIM configuration
- Rate limiting
- Bounce handling
- Unsubscribe compliance

## 📊 **Monitoring & Logging**

### **Application Monitoring**
```javascript
// Comprehensive logging throughout the system
console.log(`📊 Analytics calculated for campaign: ${campaign.name}`);
console.log(`⏰ Time delay trigger scheduled for ${recipientEmail}`);
console.log(`📧 Purchase email sent to ${recipient.email}`);
```

### **Health Checks**
```bash
# Check Redis connection
GET /api/health/redis

# Check MongoDB connection
GET /api/health/database

# Check queue status
GET /api/campaigns/worker-status
```

## 🚀 **Deployment**

### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### **Production Environment**
```bash
# Environment variables
NODE_ENV=production
MONGODB_URI=mongodb://prod-cluster:27017/delight-pool
REDIS_URL=redis://prod-redis:6379
SMTP_HOST=smtp.sendgrid.net
```

## 🤝 **Contributing**

### **Code Standards**
- ESLint configuration
- Prettier formatting
- Conventional commits
- Pull request reviews

### **Development Workflow**
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## 📄 **License**

MIT License - see LICENSE file for details

## 👨‍💻 **Technical Highlights for Interviewers**

### **Advanced JavaScript Patterns**
- **Class-based architecture** with proper encapsulation
- **Async/await** for clean asynchronous code
- **Error handling** with try-catch blocks
- **Modular design** with clear separation of concerns

### **Database Design**
- **Embedded documents** for efficient queries
- **Indexed fields** for performance
- **Schema validation** with Mongoose
- **Aggregation pipelines** for complex analytics

### **System Architecture**
- **Microservices pattern** with service separation
- **Event-driven architecture** with Redis queues
- **RESTful API design** with proper HTTP methods
- **Real-time updates** with WebSocket integration

### **Production Readiness**
- **Error handling** and logging throughout
- **Performance optimizations** at multiple levels
- **Security best practices** implementation
- **Scalable architecture** with Redis/BullMQ

### **Frontend Excellence**
- **Modern React patterns** with hooks
- **Material-UI** for professional UI
- **State management** with Context API
- **Responsive design** for all devices

This system demonstrates **enterprise-level software engineering** with attention to scalability, maintainability, and user experience. The codebase showcases advanced Node.js patterns, sophisticated database design, and modern frontend development practices. 