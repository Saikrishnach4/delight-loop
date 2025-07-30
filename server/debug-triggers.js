const queueManager = require('./services/queueManager');
const workerService = require('./services/workerService');
const EmailCampaign = require('./models/EmailCampaign');

async function debugTriggers() {
  try {
    console.log('🔍 Debugging Time Delay and Idle Triggers...\n');

    // Test 1: Check if queues are working
    console.log('📊 Test 1: Checking queue stats...');
    const stats = await queueManager.getQueueStats();
    console.log('Queue Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    console.log('\n');

    // Test 2: Schedule a test job with very short delay (5 seconds)
    console.log('⏰ Test 2: Scheduling test triggers with 5-second delays...');
    
    const timeDelayJob = await queueManager.scheduleTimeDelayTrigger(
      'test-campaign-id',
      'test@example.com',
      0,
      5000 // 5 seconds
    );
    console.log(`✅ Time delay trigger scheduled: ${timeDelayJob.id}`);
    
    const idleTimeJob = await queueManager.scheduleIdleTimeTrigger(
      'test-campaign-id',
      'test@example.com',
      0,
      5000 // 5 seconds
    );
    console.log(`✅ Idle time trigger scheduled: ${idleTimeJob.id}\n`);

    // Test 3: Check queue stats again
    console.log('📊 Test 3: Checking queue stats after scheduling...');
    const statsAfter = await queueManager.getQueueStats();
    console.log('Queue Statistics After Scheduling:');
    console.log(JSON.stringify(statsAfter, null, 2));
    console.log('\n');

    // Test 4: Wait a bit and check if jobs are being processed
    console.log('⏳ Test 4: Waiting 10 seconds to see if jobs are processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const statsAfterWait = await queueManager.getQueueStats();
    console.log('Queue Statistics After 10 seconds:');
    console.log(JSON.stringify(statsAfterWait, null, 2));
    console.log('\n');

    // Test 5: Test worker service directly
    console.log('🔧 Test 5: Testing worker service methods...');
    try {
      await workerService.processTimeDelayTrigger('test-campaign-id', 'test@example.com', 0);
    } catch (error) {
      console.log(`Expected error (campaign not found): ${error.message}`);
    }

    try {
      await workerService.processIdleTimeTrigger('test-campaign-id', 'test@example.com', 0);
    } catch (error) {
      console.log(`Expected error (campaign not found): ${error.message}`);
    }

    console.log('\n✅ Debug tests completed!');
    console.log('💡 Check the output above to see if jobs are being scheduled and processed.');

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the debug
debugTriggers(); 