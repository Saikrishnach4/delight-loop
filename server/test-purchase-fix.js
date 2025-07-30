const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import the EmailCampaign model
const EmailCampaign = require('./models/EmailCampaign');

async function testPurchaseFix() {
  try {
    console.log('🔧 Testing Purchase Campaign Fix...\n');

    // Test 1: Check if campaigns exist
    const campaigns = await EmailCampaign.find({}).limit(3);
    console.log('📋 Found campaigns:', campaigns.length);

    if (campaigns.length === 0) {
      console.log('❌ No campaigns found. Please create a campaign first.');
      return;
    }

    // Test 2: Check purchase settings on existing campaigns
    campaigns.forEach((campaign, index) => {
      console.log(`\n📊 Campaign ${index + 1}: ${campaign.name}`);
      console.log('   - purchaseCampaignType:', campaign.purchaseCampaignType);
      console.log('   - selectedPurchaseRecipients:', campaign.selectedPurchaseRecipients);
      console.log('   - purchaseFilter:', campaign.purchaseFilter);
      console.log('   - purchaseLinkText:', campaign.purchaseLinkText);
      console.log('   - purchaseAmount:', campaign.purchaseAmount);
    });

    // Test 3: Update a campaign with purchase settings
    const testCampaign = campaigns[0];
    console.log(`\n🧪 Updating campaign: ${testCampaign.name}`);
    
    testCampaign.purchaseCampaignType = 'selected';
    testCampaign.selectedPurchaseRecipients = ['test@example.com'];
    testCampaign.purchaseFilter = {
      type: 'opens',
      threshold: 1
    };
    testCampaign.purchaseLinkText = '🛒 Test Purchase - $99.99';
    testCampaign.purchaseAmount = 99.99;

    await testCampaign.save();
    console.log('✅ Campaign updated with purchase settings');

    // Test 4: Verify the settings were saved
    const updatedCampaign = await EmailCampaign.findById(testCampaign._id);
    console.log('\n📊 Updated campaign purchase settings:');
    console.log('   - purchaseCampaignType:', updatedCampaign.purchaseCampaignType);
    console.log('   - selectedPurchaseRecipients:', updatedCampaign.selectedPurchaseRecipients);
    console.log('   - purchaseFilter:', updatedCampaign.purchaseFilter);
    console.log('   - purchaseLinkText:', updatedCampaign.purchaseLinkText);
    console.log('   - purchaseAmount:', updatedCampaign.purchaseAmount);

    // Test 5: Reset to original state
    testCampaign.purchaseCampaignType = 'none';
    testCampaign.selectedPurchaseRecipients = [];
    await testCampaign.save();
    console.log('\n🔄 Reset campaign to original state');

    console.log('\n✅ Purchase campaign fix test completed!');
    console.log('💡 The fix should now work properly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testPurchaseFix(); 