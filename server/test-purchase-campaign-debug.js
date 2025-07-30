const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import the EmailCampaign model
const EmailCampaign = require('./models/EmailCampaign');

async function testPurchaseCampaignDebug() {
  try {
    console.log('🔍 Testing Purchase Campaign Debug...\n');

    // Test 1: Check if a campaign exists with purchase settings
    const campaigns = await EmailCampaign.find({}).limit(5);
    console.log('📋 Found campaigns:', campaigns.length);

    if (campaigns.length > 0) {
      const campaign = campaigns[0];
      console.log('📊 Campaign purchase settings:');
      console.log('   - purchaseCampaignType:', campaign.purchaseCampaignType);
      console.log('   - selectedPurchaseRecipients:', campaign.selectedPurchaseRecipients);
      console.log('   - purchaseFilter:', campaign.purchaseFilter);
      console.log('   - purchaseLinkText:', campaign.purchaseLinkText);
      console.log('   - purchaseAmount:', campaign.purchaseAmount);
      console.log('   - recipients count:', campaign.recipients?.length || 0);
    }

    // Test 2: Create a test campaign with purchase settings
    console.log('\n🧪 Creating test campaign with purchase settings...');
    
    const testCampaign = new EmailCampaign({
      name: 'Test Purchase Campaign',
      description: 'Test campaign for purchase functionality',
      status: 'draft',
      emailTemplate: {
        subject: 'Test Subject',
        body: 'Test Body',
        senderName: 'Test Sender'
      },
      timeDelayTrigger: { enabled: false },
      behaviorTriggers: [],
      recipients: [
        { email: 'test1@example.com', name: 'Test User 1', status: 'active' },
        { email: 'test2@example.com', name: 'Test User 2', status: 'active' }
      ],
      // Purchase Campaign Settings
      purchaseCampaignType: 'selected',
      selectedPurchaseRecipients: ['test1@example.com'],
      purchaseFilter: {
        type: 'opens',
        threshold: 1
      },
      purchaseLinkText: '🛒 Test Purchase - $99.99',
      purchaseAmount: 99.99,
      createdBy: new mongoose.Types.ObjectId() // You'll need to replace with actual user ID
    });

    await testCampaign.save();
    console.log('✅ Test campaign created with ID:', testCampaign._id);

    // Test 3: Verify the settings were saved
    const savedCampaign = await EmailCampaign.findById(testCampaign._id);
    console.log('\n📊 Saved campaign purchase settings:');
    console.log('   - purchaseCampaignType:', savedCampaign.purchaseCampaignType);
    console.log('   - selectedPurchaseRecipients:', savedCampaign.selectedPurchaseRecipients);
    console.log('   - purchaseFilter:', savedCampaign.purchaseFilter);
    console.log('   - purchaseLinkText:', savedCampaign.purchaseLinkText);
    console.log('   - purchaseAmount:', savedCampaign.purchaseAmount);

    // Test 4: Clean up - delete test campaign
    await EmailCampaign.findByIdAndDelete(testCampaign._id);
    console.log('\n🧹 Test campaign cleaned up');

    console.log('\n✅ Purchase campaign debug test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testPurchaseCampaignDebug(); 