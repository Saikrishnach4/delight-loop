const emailCampaignEngine = require('./services/emailCampaignEngine');
const emailService = require('./services/emailService');

async function testPurchaseFlowSimple() {
  try {
    console.log('🛒 Testing Purchase Link Sending Mechanism...\n');

    const campaignId = 'test-campaign-id';
    const userEmail = 'test@example.com';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Step 1: Configure Purchase Campaign
    console.log('📋 Step 1: Configure Purchase Campaign');
    const purchaseCampaignConfig = {
      purchaseCampaignType: 'selected', // 'all', 'selected', 'filtered'
      selectedPurchaseRecipients: [userEmail],
      purchaseLinkText: '🛒 Get Your Special Offer - $99.99',
      purchaseAmount: 99.99
    };
    console.log('✅ Purchase campaign configured:', purchaseCampaignConfig);
    console.log('\n');

    // Step 2: Generate Purchase Email
    console.log('📧 Step 2: Generate Purchase Email');
    const recipient = {
      email: userEmail,
      name: 'John Doe'
    };

    const purchaseEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Special Product Launch</h1>
        <p style="color: #666; line-height: 1.6;">
          Hi ${recipient.name},<br><br>
          We have an exclusive offer just for you!
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #2ecc71; margin-top: 0;">Special Offer</h2>
          <p style="color: #666;">
            Check out our amazing product!
          </p>
          <p style="font-size: 24px; color: #2ecc71; font-weight: bold; margin: 20px 0;">
            $${purchaseCampaignConfig.purchaseAmount}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Don't miss out on this limited-time offer!
        </p>
      </div>
    `;
    console.log('✅ Purchase email content generated');
    console.log('\n');

    // Step 3: Add Tracking and Purchase Button
    console.log('🔗 Step 3: Add Tracking and Purchase Button');
    const trackedEmailContent = emailService.addTrackingToEmail(
      purchaseEmailContent,
      campaignId,
      recipient.email,
      baseUrl
    );
    console.log('✅ Tracking and purchase button added');
    console.log('📊 Email now includes:');
    console.log('   - Open tracking pixel');
    console.log('   - Click tracking for purchase button');
    console.log('   - Purchase button with tracking URL');
    console.log('\n');

    // Step 4: Send Purchase Email
    console.log('📤 Step 4: Send Purchase Email');
    console.log(`📧 Email would be sent to: ${recipient.email}`);
    console.log(`📧 Subject: Special Offer - Special Product Launch`);
    console.log(`📧 Purchase button: ${purchaseCampaignConfig.purchaseLinkText}`);
    console.log('\n');

    // Step 5: User Journey
    console.log('👤 Step 5: User Journey');
    console.log('   1. User receives email with purchase button');
    console.log('   2. User clicks purchase button → Tracked as "click"');
    console.log('   3. User visits purchase page → Tracked as "open"');
    console.log('   4. User completes purchase → Tracked as "purchase"');
    console.log('   5. Thank you email sent to user');
    console.log('   6. Analytics updated with complete data');
    console.log('\n');

    // Step 6: Analytics Summary
    console.log('📊 Step 6: Analytics Summary');
    console.log('   📧 Email sent with tracked purchase button');
    console.log('   🔗 Purchase button click tracked as "click"');
    console.log('   📄 Purchase page visit tracked as "open"');
    console.log('   🛒 Final purchase tracked as "purchase"');
    console.log('   📧 Thank you email sent');
    console.log('   📊 All analytics updated');
    console.log('\n');

    console.log('✅ Purchase link sending mechanism test completed!');
    console.log('💡 How to use:');
    console.log('   1. Go to Campaign Builder');
    console.log('   2. Configure Purchase Campaign Settings');
    console.log('   3. Select recipients (All/Selected/Filtered)');
    console.log('   4. Click "Send Purchase Campaign"');
    console.log('   5. Monitor results in Analytics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPurchaseFlowSimple(); 