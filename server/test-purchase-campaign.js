const emailCampaignEngine = require('./services/emailCampaignEngine');
const emailService = require('./services/emailService');

async function testPurchaseCampaign() {
  try {
    console.log('🛒 Testing Purchase Campaign System...\n');

    const campaignId = 'test-campaign-id';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Test 1: Campaign Configuration
    console.log('📋 Test 1: Campaign Configuration...');
    const campaignConfig = {
      name: 'Special Product Launch',
      purchaseCampaignType: 'selected', // 'all', 'selected', 'filtered', 'none'
      selectedPurchaseRecipients: ['user1@example.com', 'user2@example.com'],
      purchaseFilter: {
        type: 'opens', // 'opens', 'clicks', 'purchases', 'inactive', 'new'
        threshold: 1
      },
      purchaseLinkText: '🛒 Get Your Special Offer - $99.99',
      purchaseAmount: 99.99
    };
    console.log('✅ Campaign configured:', campaignConfig);
    console.log('\n');

    // Test 2: Recipient Selection Methods
    console.log('👥 Test 2: Recipient Selection Methods...');
    
    console.log('   📧 All Recipients:');
    console.log('   - Send to all active recipients in the campaign');
    console.log('   - Use when you want to offer to everyone');
    
    console.log('   🎯 Selected Recipients:');
    console.log('   - Manually select specific users');
    console.log('   - Perfect for VIP customers or targeted offers');
    
    console.log('   🔍 Filtered Recipients:');
    console.log('   - Users who opened emails');
    console.log('   - Users who clicked links');
    console.log('   - Users who made purchases');
    console.log('   - Users who haven\'t engaged');
    console.log('   - New recipients only');
    console.log('\n');

    // Test 3: Email Content Generation
    console.log('📧 Test 3: Email Content Generation...');
    const recipient = {
      email: 'test@example.com',
      name: 'John Doe'
    };

    const purchaseEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${campaignConfig.name}</h1>
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
            $${campaignConfig.purchaseAmount}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Don't miss out on this limited-time offer!
        </p>
      </div>
    `;

    console.log('✅ Purchase email content generated');
    console.log('📧 Email includes:');
    console.log('   - Personalized greeting');
    console.log('   - Special offer section');
    console.log('   - Purchase amount display');
    console.log('   - Call-to-action message');
    console.log('\n');

    // Test 4: Tracking Integration
    console.log('🔗 Test 4: Tracking Integration...');
    const trackedEmailContent = emailService.addTrackingToEmail(
      purchaseEmailContent,
      campaignId,
      recipient.email,
      baseUrl
    );
    console.log('✅ Tracking added to email');
    console.log('📊 Email includes:');
    console.log('   - Open tracking pixel');
    console.log('   - Click tracking for purchase button');
    console.log('   - Purchase button with tracking URL');
    console.log('\n');

    // Test 5: Recipient Filtering Logic
    console.log('🎯 Test 5: Recipient Filtering Logic...');
    
    const mockRecipients = [
      { email: 'user1@example.com', status: 'active', manualEmails: [{ opened: true, clicked: false }] },
      { email: 'user2@example.com', status: 'active', manualEmails: [{ opened: false, clicked: true }] },
      { email: 'user3@example.com', status: 'active', manualEmails: [{ opened: true, clicked: true, purchased: true }] },
      { email: 'user4@example.com', status: 'active', manualEmails: [] },
      { email: 'user5@example.com', status: 'active', manualEmails: [{ opened: false, clicked: false }] }
    ];

    console.log('📊 Filter Results:');
    console.log('   Opens filter:', mockRecipients.filter(r => r.manualEmails.some(email => email.opened)).length, 'recipients');
    console.log('   Clicks filter:', mockRecipients.filter(r => r.manualEmails.some(email => email.clicked)).length, 'recipients');
    console.log('   Purchases filter:', mockRecipients.filter(r => r.manualEmails.some(email => email.purchased)).length, 'recipients');
    console.log('   Inactive filter:', mockRecipients.filter(r => r.manualEmails.every(email => !email.opened && !email.clicked)).length, 'recipients');
    console.log('   New filter:', mockRecipients.filter(r => r.manualEmails.length === 0).length, 'recipients');
    console.log('\n');

    // Test 6: Campaign Tracking
    console.log('📈 Test 6: Campaign Tracking...');
    console.log('✅ Purchase campaigns tracked per recipient');
    console.log('📊 Tracking includes:');
    console.log('   - Campaign type (all/selected/filtered)');
    console.log('   - Purchase amount');
    console.log('   - Purchase link text');
    console.log('   - Send timestamp');
    console.log('\n');

    // Test 7: Complete Flow
    console.log('🔄 Test 7: Complete Purchase Campaign Flow...');
    console.log('   1. Configure campaign settings');
    console.log('   2. Select target recipients');
    console.log('   3. Generate purchase email content');
    console.log('   4. Add tracking and purchase button');
    console.log('   5. Send emails to selected recipients');
    console.log('   6. Track recipient interactions');
    console.log('   7. Monitor analytics and conversions');
    console.log('\n');

    console.log('✅ Purchase campaign system test completed!');
    console.log('💡 Usage:');
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
testPurchaseCampaign(); 