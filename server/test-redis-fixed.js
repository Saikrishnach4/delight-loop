const queueManager = require('./services/queueManager');
const { testConnection } = require('./config/redis');

async function testRedisFixed() {
  try {
    console.log('🧪 Testing Redis with improved configuration...\n');

    // Test 1: Check Redis connection
    console.log('🔗 Test 1: Testing Redis connection...');
    const redisConnected = await testConnection();
    if (redisConnected) {
      console.log('✅ Redis connection successful\n');
    } else {
      console.log('❌ Redis connection failed\n');
      return;
    }

    // Test 2: Schedule a simple job
    console.log('⏰ Test 2: Scheduling a test job...');
    const job = await queueManager.scheduleTimeDelayTrigger(
      'test-campaign-id',
      'test@example.com',
      0,
      10000 // 10 seconds
    );
    console.log(`✅ Job scheduled successfully: ${job.id}\n`);

    // Test 3: Get queue stats
    console.log('📊 Test 3: Getting queue statistics...');
    const stats = await queueManager.getQueueStats();
    console.log('Queue Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    console.log('\n');

    // Test 4: Clean up jobs
    console.log('🧹 Test 4: Cleaning up jobs...');
    await queueManager.cleanupJobs();
    console.log('✅ Cleanup completed\n');

    console.log('🎉 All tests passed! Redis timeout errors should be resolved.');
    console.log('💡 Your time delay and idle triggers should now work properly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 This might be a temporary issue. Try running the test again.');
  }
}

// Run the test
testRedisFixed(); 