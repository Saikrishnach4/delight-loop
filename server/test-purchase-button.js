const emailService = require('./services/emailService');

async function testPurchaseButton() {
  try {
    console.log('🛒 Testing Purchase Button Addition...\n');

    const campaignId = 'test-campaign-id';
    const userEmail = 'test@example.com';
    const baseUrl = 'http://localhost:5000';

    // Test 1: Regular email (should add purchase button)
    console.log('📧 Test 1: Regular email content');
    const regularEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Welcome to our newsletter!</h1>
        <p style="color: #666; line-height: 1.6;">
          Hi there,<br><br>
          Thanks for subscribing to our newsletter!
        </p>
        <p style="color: #666; line-height: 1.6;">
          Check out our latest updates and news.
        </p>
      </div>
    `;

    const regularEmailWithTracking = emailService.addTrackingToEmail(
      regularEmailContent,
      campaignId,
      userEmail,
      baseUrl
    );

    console.log('✅ Regular email processed');
    console.log('📧 Contains purchase button:', regularEmailWithTracking.includes('Purchase Now'));
    console.log('\n');

    // Test 2: Purchase campaign email (should add custom purchase button)
    console.log('📧 Test 2: Purchase campaign email content');
    const purchaseEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Special Product Launch</h1>
        <p style="color: #666; line-height: 1.6;">
          Hi John,<br><br>
          We have an exclusive offer just for you!
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #2ecc71; margin-top: 0;">Special Offer</h2>
          <p style="color: #666;">
            Check out our amazing product!
          </p>
          <p style="font-size: 24px; color: #2ecc71; font-weight: bold; margin: 20px 0;">
            $149.99
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Don't miss out on this limited-time offer!
        </p>
      </div>
    `;

    const purchaseEmailWithTracking = emailService.addTrackingToEmail(
      purchaseEmailContent,
      campaignId,
      userEmail,
      baseUrl,
      {
        purchaseCampaignType: 'selected',
        purchaseLinkText: '🛒 Get Your Special Offer - $149.99',
        purchaseAmount: 149.99
      }
    );

    console.log('✅ Purchase campaign email processed');
    console.log('📧 Contains purchase button:', purchaseEmailWithTracking.includes('Purchase Now'));
    console.log('📧 Contains custom text:', purchaseEmailWithTracking.includes('Get Your Special Offer'));
    console.log('📧 Contains custom amount:', purchaseEmailWithTracking.includes('$149.99'));
    console.log('\n');

    // Test 3: Email with existing purchase content (should not add duplicate)
    console.log('📧 Test 3: Email with existing purchase content');
    const existingPurchaseEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Product Catalog</h1>
        <p style="color: #666; line-height: 1.6;">
          Hi there,<br><br>
          Check out our products and purchase what you need!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://example.com/purchase" style="
            display: inline-block;
            background: #007bff;
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
          ">
            Purchase Now - $99.99
          </a>
        </div>
      </div>
    `;

    const existingPurchaseEmailWithTracking = emailService.addTrackingToEmail(
      existingPurchaseEmailContent,
      campaignId,
      userEmail,
      baseUrl,
      {
        purchaseCampaignType: 'selected',
        purchaseLinkText: '🛒 Get Your Special Offer - $149.99',
        purchaseAmount: 149.99
      }
    );

    console.log('✅ Email with existing purchase content processed');
    console.log('📧 Contains original purchase button:', existingPurchaseEmailWithTracking.includes('Purchase Now - $99.99'));
    console.log('📧 Contains new purchase button:', existingPurchaseEmailWithTracking.includes('Get Your Special Offer'));
    console.log('\n');

    console.log('✅ Purchase button test completed!');
    console.log('💡 The purchase button should now be added correctly to purchase campaign emails.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPurchaseButton(); 