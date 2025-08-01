const { Queue, Worker } = require('bullmq');
const { redis } = require('../config/redis');
const EmailCampaign = require('../models/EmailCampaign');

// Import workerService dynamically to avoid circular dependency
let workerService;
try {
  workerService = require('./workerService');
} catch (error) {
  console.error('❌ Failed to import workerService:', error.message);
}

// Queue names
const QUEUE_NAMES = {
  TIME_DELAY_TRIGGER: 'time-delay-trigger',
  IDLE_TIME_TRIGGER: 'idle-time-trigger',
  EMAIL_SEND: 'email-send',
  BEHAVIOR_TRIGGER: 'behavior-trigger'
};

// Create queues
const timeDelayQueue = new Queue(QUEUE_NAMES.TIME_DELAY_TRIGGER, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const idleTimeQueue = new Queue(QUEUE_NAMES.IDLE_TIME_TRIGGER, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const emailSendQueue = new Queue(QUEUE_NAMES.EMAIL_SEND, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const behaviorTriggerQueue = new Queue(QUEUE_NAMES.BEHAVIOR_TRIGGER, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Note: QueueScheduler is not needed in newer versions of BullMQ
// Delayed jobs are handled automatically by the Queue

// Workers
const timeDelayWorker = new Worker(QUEUE_NAMES.TIME_DELAY_TRIGGER, async (job) => {
  console.log(`⏰ Processing time delay trigger job: ${job.id}`);
  const { campaignId, recipientEmail, manualEmailIndex } = job.data;
  
  try {
    // Import workerService dynamically to ensure it's available
    const workerService = require('./workerService');
    await workerService.processTimeDelayTrigger(campaignId, recipientEmail, manualEmailIndex);
    console.log(`✅ Time delay trigger job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Time delay trigger job ${job.id} failed:`, error);
    console.error(`❌ Error details:`, error.stack);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 5
});

const idleTimeWorker = new Worker(QUEUE_NAMES.IDLE_TIME_TRIGGER, async (job) => {
  console.log(`⏰ Processing idle time trigger job: ${job.id}`);
  const { campaignId, recipientEmail, manualEmailIndex } = job.data;
  
  try {
    // Import workerService dynamically to ensure it's available
    const workerService = require('./workerService');
    await workerService.processIdleTimeTrigger(campaignId, recipientEmail, manualEmailIndex);
    console.log(`✅ Idle time trigger job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Idle time trigger job ${job.id} failed:`, error);
    console.error(`❌ Error details:`, error.stack);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 5
});

const emailSendWorker = new Worker(QUEUE_NAMES.EMAIL_SEND, async (job) => {
  console.log(`📧 Processing email send job: ${job.id}`);
  const { campaignId, recipientEmail, emailTemplate, emailType } = job.data;
  
  try {
    // Fetch the campaign first
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    // Import workerService dynamically to ensure it's available
    const workerService = require('./workerService');
    await workerService.sendSingleEmail(campaign, recipientEmail, emailTemplate);
    console.log(`✅ Email send job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Email send job ${job.id} failed:`, error);
    console.error(`❌ Error details:`, error.stack);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 10
});

const behaviorTriggerWorker = new Worker(QUEUE_NAMES.BEHAVIOR_TRIGGER, async (job) => {
  console.log(`🎯 Processing behavior trigger job: ${job.id}`);
  const { campaignId, userEmail, behavior } = job.data;
  
  try {
    // Import workerService dynamically to ensure it's available
    const workerService = require('./workerService');
    await workerService.handleUserBehavior(campaignId, userEmail, behavior);
    console.log(`✅ Behavior trigger job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Behavior trigger job ${job.id} failed:`, error);
    console.error(`❌ Error details:`, error.stack);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 5
});

// Worker event handlers
timeDelayWorker.on('completed', (job) => {
  console.log(`✅ Time delay worker completed job ${job.id} for ${job.data.recipientEmail}`);
});

timeDelayWorker.on('failed', (job, err) => {
  console.error(`❌ Time delay worker failed job ${job.id} for ${job.data.recipientEmail}:`, err);
});

timeDelayWorker.on('active', (job) => {
  console.log(`🔄 Time delay worker started processing job ${job.id} for ${job.data.recipientEmail}`);
});

idleTimeWorker.on('completed', (job) => {
  console.log(`✅ Idle time worker completed job ${job.id} for ${job.data.recipientEmail}`);
});

idleTimeWorker.on('failed', (job, err) => {
  console.error(`❌ Idle time worker failed job ${job.id} for ${job.data.recipientEmail}:`, err);
});

idleTimeWorker.on('active', (job) => {
  console.log(`🔄 Idle time worker started processing job ${job.id} for ${job.data.recipientEmail}`);
});

emailSendWorker.on('completed', (job) => {
  console.log(`✅ Email send worker completed job ${job.id} for ${job.data.recipientEmail}`);
});

emailSendWorker.on('failed', (job, err) => {
  console.error(`❌ Email send worker failed job ${job.id} for ${job.data.recipientEmail}:`, err);
});

emailSendWorker.on('active', (job) => {
  console.log(`🔄 Email send worker started processing job ${job.id} for ${job.data.recipientEmail}`);
});

behaviorTriggerWorker.on('completed', (job) => {
  console.log(`✅ Behavior trigger worker completed job ${job.id} for ${job.data.userEmail}`);
});

behaviorTriggerWorker.on('failed', (job, err) => {
  console.error(`❌ Behavior trigger worker failed job ${job.id} for ${job.data.userEmail}:`, err);
});

behaviorTriggerWorker.on('active', (job) => {
  console.log(`🔄 Behavior trigger worker started processing job ${job.id} for ${job.data.userEmail}`);
});

// Initialize workers and log their status
const initializeWorkers = () => {
  console.log('🔧 Initializing BullMQ workers...');
  console.log(`⏰ Time delay worker: ${timeDelayWorker.name} (concurrency: ${timeDelayWorker.concurrency})`);
  console.log(`⏰ Idle time worker: ${idleTimeWorker.name} (concurrency: ${idleTimeWorker.concurrency})`);
  console.log(`📧 Email send worker: ${emailSendWorker.name} (concurrency: ${emailSendWorker.concurrency})`);
  console.log(`🎯 Behavior trigger worker: ${behaviorTriggerWorker.name} (concurrency: ${behaviorTriggerWorker.concurrency})`);

  // Check worker status
  console.log(`🔍 Time delay worker is running: ${timeDelayWorker.isRunning()}`);
  console.log(`🔍 Idle time worker is running: ${idleTimeWorker.isRunning()}`);
  console.log(`🔍 Email send worker is running: ${emailSendWorker.isRunning()}`);
  console.log(`🔍 Behavior trigger worker is running: ${behaviorTriggerWorker.isRunning()}`);

  // Test if workers can process jobs
  console.log('🧪 Testing worker initialization...');
  
  // Check if Redis is connected
  if (redis.status === 'ready') {
    console.log('✅ Redis is ready');
  } else {
    console.log(`⚠️ Redis status: ${redis.status}`);
  }

  // Test job scheduling to verify workers are working
  console.log('🧪 Testing worker functionality with a test job...');
  
  // Get a real active campaign ID for testing
  EmailCampaign.findOne({ status: 'active' }).then(campaign => {
    if (campaign && campaign.recipients && campaign.recipients.length > 0) {
      const testRecipient = campaign.recipients[0].email;
      scheduleIdleTimeTrigger(campaign._id.toString(), testRecipient, 0, 5000)
        .then(() => {
          console.log('✅ Test idle job scheduled successfully');
          console.log('✅ Workers are ready to process jobs');
        })
        .catch((error) => {
          console.error('❌ Test job scheduling failed:', error.message);
          console.error('❌ Workers may not be working properly');
        });
    } else {
      console.log('⚠️ No campaigns found for worker testing');
    }
  }).catch(error => {
    console.error('❌ Error finding campaign for worker test:', error.message);
  });

  console.log('✅ All workers initialized and ready to process jobs');
};

// Initialize workers with delay to ensure Redis is fully connected
setTimeout(() => {
  console.log('🔄 Delayed worker initialization to ensure Redis is ready...');
  initializeWorkers();
}, 2000);

// Queue management functions
const scheduleTimeDelayTrigger = async (campaignId, recipientEmail, manualEmailIndex, delayMs) => {
  try {
    console.log(`⏰ Attempting to schedule time delay trigger for ${recipientEmail} in ${delayMs}ms`);
    
    const job = await timeDelayQueue.add(
      'time-delay-trigger',
      { campaignId, recipientEmail, manualEmailIndex },
      {
        delay: delayMs,
        jobId: `time-delay-${campaignId}-${recipientEmail}-${manualEmailIndex}`,
        removeOnComplete: true
      }
    );
    
    console.log(`✅ Scheduled time delay trigger job ${job.id} for ${recipientEmail} in ${delayMs}ms`);
    console.log(`📅 Job will execute at: ${new Date(Date.now() + delayMs).toISOString()}`);
    
    // Verify job was added to queue
    const waitingJobs = await timeDelayQueue.getWaiting();
    console.log(`📊 Time delay queue now has ${waitingJobs.length} waiting jobs`);
    
    return job;
  } catch (error) {
    console.error('❌ Failed to schedule time delay trigger:', error.message);
    console.error('❌ Error details:', error.stack);
    
    if (error.message.includes('Command timed out')) {
      console.warn('⚠️ Redis timeout while scheduling time delay trigger - retrying...');
      // Wait a bit and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const job = await timeDelayQueue.add(
          'time-delay-trigger',
          { campaignId, recipientEmail, manualEmailIndex },
          {
            delay: delayMs,
            jobId: `time-delay-${campaignId}-${recipientEmail}-${manualEmailIndex}`,
            removeOnComplete: true
          }
        );
        console.log(`✅ Scheduled time delay trigger job ${job.id} (retry) for ${recipientEmail} in ${delayMs}ms`);
        return job;
      } catch (retryError) {
        console.error('❌ Failed to schedule time delay trigger after retry:', retryError.message);
        throw retryError;
      }
    } else {
      throw error;
    }
  }
};

const scheduleIdleTimeTrigger = async (campaignId, recipientEmail, manualEmailIndex, delayMs) => {
  try {
    console.log(`⏰ Attempting to schedule idle time trigger for ${recipientEmail} in ${delayMs}ms`);
    console.log(`🔍 Job details: campaignId=${campaignId}, manualEmailIndex=${manualEmailIndex}`);
    
    const job = await idleTimeQueue.add(
      'idle-time-trigger',
      { campaignId, recipientEmail, manualEmailIndex },
      {
        delay: delayMs,
        jobId: `idle-time-${campaignId}-${recipientEmail}-${manualEmailIndex}`,
        removeOnComplete: true
      }
    );
    
    console.log(`✅ Scheduled idle time trigger job ${job.id} for ${recipientEmail} in ${delayMs}ms`);
    console.log(`📅 Job will execute at: ${new Date(Date.now() + delayMs).toISOString()}`);
    console.log(`🕐 Current time: ${new Date().toISOString()}`);
    
    // Verify job was added to queue
    const waitingJobs = await idleTimeQueue.getWaiting();
    console.log(`📊 Idle time queue now has ${waitingJobs.length} waiting jobs`);
    
    // Check if worker is running
    console.log(`🔍 Idle time worker is running: ${idleTimeWorker.isRunning()}`);
    console.log(`🔍 Idle time worker status: ${idleTimeWorker.status}`);
    
    return job;
  } catch (error) {
    console.error('❌ Failed to schedule idle time trigger:', error.message);
    console.error('❌ Error details:', error.stack);
    
    if (error.message.includes('Command timed out')) {
      console.warn('⚠️ Redis timeout while scheduling idle time trigger - retrying...');
      // Wait a bit and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const job = await idleTimeQueue.add(
          'idle-time-trigger',
          { campaignId, recipientEmail, manualEmailIndex },
          {
            delay: delayMs,
            jobId: `idle-time-${campaignId}-${recipientEmail}-${manualEmailIndex}`,
            removeOnComplete: true
          }
        );
        console.log(`✅ Scheduled idle time trigger job ${job.id} (retry) for ${recipientEmail} in ${delayMs}ms`);
        return job;
      } catch (retryError) {
        console.error('❌ Failed to schedule idle time trigger after retry:', retryError.message);
        throw retryError;
      }
    } else {
      throw error;
    }
  }
};

const addEmailSendJob = async (campaignId, recipientEmail, emailTemplate, emailType = 'manual') => {
  try {
    const job = await emailSendQueue.add(
      'email-send',
      { campaignId, recipientEmail, emailTemplate, emailType },
      {
        jobId: `email-send-${campaignId}-${recipientEmail}-${Date.now()}`,
        removeOnComplete: true
      }
    );
    console.log(`📧 Added email send job ${job.id}`);
    return job;
  } catch (error) {
    console.error('❌ Failed to add email send job:', error);
    throw error;
  }
};

const addBehaviorTriggerJob = async (campaignId, userEmail, behavior, additionalData = {}) => {
  try {
    const job = await behaviorTriggerQueue.add(
      'behavior-trigger',
      { campaignId, userEmail, behavior, ...additionalData },
      {
        jobId: `behavior-${campaignId}-${userEmail}-${behavior}-${Date.now()}`,
        removeOnComplete: true
      }
    );
    console.log(`🎯 Added behavior trigger job ${job.id} for ${behavior}`);
    return job;
  } catch (error) {
    console.error('❌ Failed to add behavior trigger job:', error);
    throw error;
  }
};

// Clean up existing jobs (useful for development)
const cleanupJobs = async () => {
  try {
    const cleanupPromises = [
      timeDelayQueue.clean(0, 1000, 'completed').catch(err => console.warn('⚠️ Time delay cleanup warning:', err.message)),
      timeDelayQueue.clean(0, 1000, 'failed').catch(err => console.warn('⚠️ Time delay failed cleanup warning:', err.message)),
      idleTimeQueue.clean(0, 1000, 'completed').catch(err => console.warn('⚠️ Idle time cleanup warning:', err.message)),
      idleTimeQueue.clean(0, 1000, 'failed').catch(err => console.warn('⚠️ Idle time failed cleanup warning:', err.message)),
      emailSendQueue.clean(0, 1000, 'completed').catch(err => console.warn('⚠️ Email send cleanup warning:', err.message)),
      emailSendQueue.clean(0, 1000, 'failed').catch(err => console.warn('⚠️ Email send failed cleanup warning:', err.message)),
      behaviorTriggerQueue.clean(0, 1000, 'completed').catch(err => console.warn('⚠️ Behavior trigger cleanup warning:', err.message)),
      behaviorTriggerQueue.clean(0, 1000, 'failed').catch(err => console.warn('⚠️ Behavior trigger failed cleanup warning:', err.message))
    ];
    
    await Promise.allSettled(cleanupPromises);
    console.log('🧹 Cleaned up old jobs');
  } catch (error) {
    console.warn('⚠️ Cleanup jobs warning:', error.message);
  }
};

// Get queue statistics
const getQueueStats = async () => {
  try {
    const statsPromises = {
      timeDelay: {
        waiting: timeDelayQueue.getWaiting().catch(() => 0),
        active: timeDelayQueue.getActive().catch(() => 0),
        completed: timeDelayQueue.getCompleted().catch(() => 0),
        failed: timeDelayQueue.getFailed().catch(() => 0)
      },
      idleTime: {
        waiting: idleTimeQueue.getWaiting().catch(() => 0),
        active: idleTimeQueue.getActive().catch(() => 0),
        completed: idleTimeQueue.getCompleted().catch(() => 0),
        failed: idleTimeQueue.getFailed().catch(() => 0)
      },
      emailSend: {
        waiting: emailSendQueue.getWaiting().catch(() => 0),
        active: emailSendQueue.getActive().catch(() => 0),
        completed: emailSendQueue.getCompleted().catch(() => 0),
        failed: emailSendQueue.getFailed().catch(() => 0)
      },
      behaviorTrigger: {
        waiting: behaviorTriggerQueue.getWaiting().catch(() => 0),
        active: behaviorTriggerQueue.getActive().catch(() => 0),
        completed: behaviorTriggerQueue.getCompleted().catch(() => 0),
        failed: behaviorTriggerQueue.getFailed().catch(() => 0)
      }
    };

    const stats = {
      timeDelay: {
        waiting: await statsPromises.timeDelay.waiting,
        active: await statsPromises.timeDelay.active,
        completed: await statsPromises.timeDelay.completed,
        failed: await statsPromises.timeDelay.failed
      },
      idleTime: {
        waiting: await statsPromises.idleTime.waiting,
        active: await statsPromises.idleTime.active,
        completed: await statsPromises.idleTime.completed,
        failed: await statsPromises.idleTime.failed
      },
      emailSend: {
        waiting: await statsPromises.emailSend.waiting,
        active: await statsPromises.emailSend.active,
        completed: await statsPromises.emailSend.completed,
        failed: await statsPromises.emailSend.failed
      },
      behaviorTrigger: {
        waiting: await statsPromises.behaviorTrigger.waiting,
        active: await statsPromises.behaviorTrigger.active,
        completed: await statsPromises.behaviorTrigger.completed,
        failed: await statsPromises.behaviorTrigger.failed
      }
    };
    return stats;
  } catch (error) {
    console.warn('⚠️ Failed to get queue stats:', error.message);
    return {
      timeDelay: { waiting: 0, active: 0, completed: 0, failed: 0 },
      idleTime: { waiting: 0, active: 0, completed: 0, failed: 0 },
      emailSend: { waiting: 0, active: 0, completed: 0, failed: 0 },
      behaviorTrigger: { waiting: 0, active: 0, completed: 0, failed: 0 }
    };
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down queue manager gracefully...');
  
  try {
    await timeDelayWorker.close();
    await idleTimeWorker.close();
    await emailSendWorker.close();
    await behaviorTriggerWorker.close();
    
    await timeDelayQueue.close();
    await idleTimeQueue.close();
    await emailSendQueue.close();
    await behaviorTriggerQueue.close();
    
    console.log('✅ Queue manager shut down successfully');
  } catch (error) {
    console.error('❌ Error during queue manager shutdown:', error);
  }
};

module.exports = {
  scheduleTimeDelayTrigger,
  scheduleIdleTimeTrigger,
  addEmailSendJob,
  addBehaviorTriggerJob,
  cleanupJobs,
  getQueueStats,
  gracefulShutdown,
  QUEUE_NAMES
}; 