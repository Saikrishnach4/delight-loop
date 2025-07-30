const { redis, testConnection } = require('./config/redis');
const queueManager = require('./services/queueManager');

async function testRedisAndBullMQ() {
  console.log('🧪 Testing Redis and BullMQ setup...\n');

  try {
    // Test Redis connection
    console.log('1. Testing Redis connection...');
    const redisConnected = await testConnection();
    if (redisConnected) {
      console.log('✅ Redis connection successful\n');
    } else {
      console.log('❌ Redis connection failed\n');
      return;
    }

    // Test queue manager
    console.log('2. Testing queue manager...');
    const stats = await queueManager.getQueueStats();
    console.log('✅ Queue manager working');
    console.log('📊 Current queue stats:', JSON.stringify(stats, null, 2), '\n');

    // Test adding a job
    console.log('3. Testing job scheduling...');
    const testJob = await queueManager.addEmailSendJob(
      'test-campaign-id',
      'test@example.com',
      { subject: 'Test', body: 'Test email' },
      'test'
    );
    console.log('✅ Test job added:', testJob.id, '\n');

    // Clean up test job
    console.log('4. Cleaning up test job...');
    await queueManager.cleanupJobs();
    console.log('✅ Cleanup completed\n');

    console.log('🎉 All tests passed! Redis and BullMQ are working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Create an email campaign');
    console.log('3. Send manual emails to test the trigger system');
    console.log('4. Monitor queue stats: GET /api/campaigns/queue/stats');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close Redis connection
    await redis.quit();
    process.exit(0);
  }
}

// Run the test
testRedisAndBullMQ(); 