const emailCampaignEngine = require('./services/emailCampaignEngine');

async function testPurchaseBehavior() {
  try {
    console.log('🛒 Testing Purchase Behavior Tracking...\n');

    // Test 1: Test purchase tracking with amount
    console.log('📊 Test 1: Testing purchase tracking with amount...');
    const purchaseResult = await emailCampaignEngine.handleUserBehavior(
      'test-campaign-id',
      'test@example.com',
      'purchase',
      {
        purchaseAmount: 99.99,
        purchaseCurrency: 'USD'
      }
    );
    console.log('Purchase Result:', purchaseResult);
    console.log('\n');

    // Test 2: Test purchase tracking without amount
    console.log('📊 Test 2: Testing purchase tracking without amount...');
    const purchaseResult2 = await emailCampaignEngine.handleUserBehavior(
      'test-campaign-id',
      'test@example.com',
      'purchase'
    );
    console.log('Purchase Result (no amount):', purchaseResult2);
    console.log('\n');

    // Test 3: Test behavior trigger for purchase
    console.log('📊 Test 3: Testing behavior trigger for purchase...');
    const triggerResult = await emailCampaignEngine.testBehaviorTrigger(
      'test-campaign-id',
      'test@example.com',
      'purchase'
    );
    console.log('Trigger Result:', triggerResult);
    console.log('\n');

    console.log('✅ Purchase behavior tests completed!');
    console.log('💡 Check the logs above to see how purchase tracking works.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPurchaseBehavior(); 