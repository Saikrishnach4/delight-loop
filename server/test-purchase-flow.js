const emailCampaignEngine = require('./services/emailCampaignEngine');
const emailService = require('./services/emailService');

async function testPurchaseFlow() {
  try {
    console.log('🛒 Testing Complete Purchase Flow...\n');

    const campaignId = 'test-campaign-id';
    const userEmail = 'test@example.com';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Test 1: Generate email with purchase link
    console.log('📧 Test 1: Generating email with purchase link...');
    const emailContent = `
      <html>
        <body>
          <h1>Welcome to our amazing product!</h1>
          <p>This is a test email with a purchase link.</p>
          <p>Click the purchase button below to buy our product.</p>
        </body>
      </html>
    `;

    const trackedEmail = emailService.addTrackingToEmail(emailContent, campaignId, userEmail, baseUrl);
    console.log('✅ Email with purchase link generated');
    console.log('📧 Purchase URL:', `${baseUrl}/api/campaigns/purchase/${campaignId}/${encodeURIComponent(userEmail)}`);
    console.log('\n');

    // Test 2: Simulate user clicking purchase link
    console.log('🔗 Test 2: Simulating user clicking purchase link...');
    console.log('📧 User would see purchase page at:', `${baseUrl}/api/campaigns/purchase/${campaignId}/${encodeURIComponent(userEmail)}`);
    console.log('📧 Purchase page shows product details and "Purchase Now" button');
    console.log('\n');

    // Test 3: Simulate user clicking purchase button
    console.log('🛒 Test 3: Simulating user clicking purchase button...');
    const purchaseResult = await emailCampaignEngine.handleUserBehavior(
      campaignId,
      userEmail,
      'purchase',
      {
        purchaseAmount: 99.99,
        purchaseCurrency: 'USD',
        orderId: 'ORD-' + Date.now()
      }
    );
    console.log('✅ Purchase processed:', purchaseResult);
    console.log('\n');

    // Test 4: Check analytics would be updated
    console.log('📊 Test 4: Analytics would be updated with:');
    console.log('   - Total purchases: +1');
    console.log('   - Total revenue: +$99.99');
    console.log('   - Purchase tracking for user');
    console.log('   - Thank you email sent');
    console.log('\n');

    // Test 5: Show what the user would see
    console.log('🎯 Test 5: User Experience Flow:');
    console.log('   1. User receives email with purchase button');
    console.log('   2. User clicks purchase button → Goes to purchase page');
    console.log('   3. User clicks "Purchase Now" → Purchase processed');
    console.log('   4. User sees success message → Redirected to thank you page');
    console.log('   5. User receives "Thank you for purchasing" email');
    console.log('   6. Purchase appears in analytics dashboard');
    console.log('\n');

    console.log('✅ Complete purchase flow test completed!');
    console.log('💡 To test the actual flow:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Send an email to a recipient');
    console.log('   3. Click the purchase link in the email');
    console.log('   4. Click the purchase button on the page');
    console.log('   5. Check analytics for the purchase data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPurchaseFlow(); 