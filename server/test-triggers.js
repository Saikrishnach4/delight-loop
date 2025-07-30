const queueManager = require('./services/queueManager');
const workerService = require('./services/workerService');
const EmailCampaign = require('./models/EmailCampaign');

async function testTriggers() {
  try {
    console.log('🧪 Testing Time Delay and Idle Triggers...\n');

    // Test 1: Schedule a time delay trigger (1 minute delay)
    console.log('📅 Test 1: Scheduling time delay trigger (1 minute delay)...');
    const timeDelayJob = await queueManager.scheduleTimeDelayTrigger(
      'test-campaign-id',
      'test@example.com',
      0,
      60000 // 1 minute
    );
    console.log(`✅ Time delay trigger scheduled: ${timeDelayJob.id}\n`);

    // Test 2: Schedule an idle time trigger (30 seconds delay)
    console.log('⏰ Test 2: Scheduling idle time trigger (30 seconds delay)...');
    const idleTimeJob = await queueManager.scheduleIdleTimeTrigger(
      'test-campaign-id',
      'test@example.com',
      0,
      30000 // 30 seconds
    );
    console.log(`✅ Idle time trigger scheduled: ${idleTimeJob.id}\n`);

    // Test 3: Get queue stats
    console.log('📊 Test 3: Getting queue stats...');
    const stats = await queueManager.getQueueStats();
    console.log('Queue Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    console.log('\n');

    // Test 4: Test worker service directly
    console.log('🔧 Test 4: Testing worker service methods...');
    try {
      await workerService.processTimeDelayTrigger('test-campaign-id', 'test@example.com', 0);
    } catch (error) {
      console.log(`Expected error (campaign not found): ${error.message}`);
    }

    console.log('\n✅ All trigger tests completed!');
    console.log('💡 Check your server logs to see if the scheduled jobs are being processed.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTriggers(); 