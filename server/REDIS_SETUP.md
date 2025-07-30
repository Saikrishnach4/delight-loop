# 🔄 **Redis + BullMQ Setup Guide**

## 🎯 **Overview**

The server has been converted from using `setTimeout`/`setInterval` to using **Redis** with **BullMQ** for job scheduling. This provides:

- ✅ **Scalability**: Jobs can be processed across multiple server instances
- ✅ **Reliability**: Jobs persist even if the server restarts
- ✅ **Performance**: Better handling of large numbers of scheduled jobs
- ✅ **Monitoring**: Built-in job statistics and monitoring

## 🔧 **Required Environment Variables**

Add these to your `.env` file:

```env
# Redis Configuration (BullMQ)
REDIS_URL=rediss://default:ATKIAAIjcDEyYjRiYjBlMDYxMmY0NjY5YmM3NDMzMzBhMTI2Y2I4MXAxMA@special-lemming-12936.upstash.io:6379

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/delight-loop

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000
```

## 📦 **New Dependencies**

The following packages have been added:

```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.2"
}
```

## 🚀 **Installation**

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   - Copy the Redis URL provided
   - Configure your email settings
   - Set up MongoDB connection

3. **Start the server:**
   ```bash
   npm run dev
   ```

## 🔄 **How It Works**

### **Before (setTimeout/setInterval):**
- Server checked for triggers every 30 seconds
- All timing was handled in memory
- Jobs lost if server restarted

### **After (BullMQ):**
- Each trigger is scheduled as an individual job
- Jobs persist in Redis
- Workers process jobs when they're due
- Multiple server instances can share the workload

## 📊 **Queue Types**

1. **Time Delay Trigger Queue** (`time-delay-trigger`)
   - Handles follow-up emails after time delays
   - Jobs scheduled when manual emails are sent

2. **Idle Time Trigger Queue** (`idle-time-trigger`)
   - Handles reminder emails for idle users
   - Jobs scheduled when emails with links are sent

3. **Email Send Queue** (`email-send`)
   - Handles actual email sending
   - Provides retry logic and error handling

4. **Behavior Trigger Queue** (`behavior-trigger`)
   - Handles user behavior responses (open/click)
   - Processes follow-up emails based on user actions

## 🛠️ **API Endpoints**

### **Queue Statistics**
```http
GET /api/campaigns/queue/stats
```
Returns statistics for all queues (waiting, active, completed, failed jobs).

### **Queue Cleanup**
```http
POST /api/campaigns/queue/cleanup
```
Cleans up old completed and failed jobs.

## 📈 **Monitoring**

### **Console Logs**
The system provides detailed logging:
```
🔗 Redis connected successfully
✅ Redis is ready to accept commands
⏰ BullMQ queue-based trigger system is active
📧 Processing time delay trigger job: time-delay-123
✅ Time delay trigger job completed successfully
```

### **Queue Statistics**
Check queue health via the API:
```bash
curl http://localhost:5000/api/campaigns/queue/stats
```

## 🔧 **Configuration**

### **Redis Connection**
The Redis connection is configured in `config/redis.js` with:
- Automatic reconnection
- Error handling
- Connection pooling
- Timeout settings

### **Queue Settings**
Each queue is configured with:
- **Retry Logic**: 3 attempts with exponential backoff
- **Job Cleanup**: Automatic cleanup of completed/failed jobs
- **Concurrency**: Multiple workers for parallel processing

## 🚨 **Troubleshooting**

### **Redis Connection Issues**
1. Check your `REDIS_URL` is correct
2. Ensure Redis service is running
3. Check network connectivity

### **Job Processing Issues**
1. Check queue statistics via API
2. Review console logs for errors
3. Verify email service configuration

### **Performance Issues**
1. Monitor queue statistics
2. Adjust worker concurrency settings
3. Check Redis memory usage

## 🔄 **Migration from Old System**

The system automatically:
- ✅ Migrates from setTimeout/setInterval to BullMQ
- ✅ Maintains the same idle time logic
- ✅ Preserves all existing functionality
- ✅ Adds better error handling and retry logic

## 🎉 **Benefits**

1. **Scalability**: Can handle thousands of scheduled jobs
2. **Reliability**: Jobs survive server restarts
3. **Monitoring**: Built-in job tracking and statistics
4. **Performance**: Better resource utilization
5. **Maintenance**: Easier to debug and monitor

## 📝 **Next Steps**

1. Test the system with your Redis URL
2. Monitor queue statistics
3. Adjust concurrency settings if needed
4. Set up monitoring alerts for failed jobs

**🎯 Your email campaign system is now powered by Redis and BullMQ!** 