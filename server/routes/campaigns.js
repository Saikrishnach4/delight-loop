const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const EmailCampaign = require('../models/EmailCampaign');
const emailCampaignEngine = require('../services/emailCampaignEngine');
const emailService = require('../services/emailService');
const queueManager = require('../services/queueManager');

// Get all campaigns for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({ createdBy: req.user.id })
      .select('name description status analytics createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get a specific campaign by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create a new campaign
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, emailTemplate, timeDelayTrigger, behaviorTriggers } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }

    const campaign = new EmailCampaign({
      name,
      description,
      emailTemplate: emailTemplate || {},
      timeDelayTrigger: timeDelayTrigger || { enabled: false },
      behaviorTriggers: behaviorTriggers || [],
      recipients: [],
      createdBy: req.user.id
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update a campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      emailTemplate, 
      timeDelayTrigger, 
      behaviorTriggers, 
      status,
      // Purchase Campaign Settings
      purchaseCampaignType,
      selectedPurchaseRecipients,
      purchaseFilter,
      purchaseLinkText,
      purchaseAmount
    } = req.body;

    console.log('🔍 Received campaign update data:', {
      purchaseCampaignType,
      selectedPurchaseRecipients,
      purchaseFilter,
      purchaseLinkText,
      purchaseAmount
    });

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update fields
    if (name !== undefined) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (emailTemplate !== undefined) campaign.emailTemplate = emailTemplate;
    if (timeDelayTrigger !== undefined) campaign.timeDelayTrigger = timeDelayTrigger;
    if (behaviorTriggers !== undefined) campaign.behaviorTriggers = behaviorTriggers;
    if (status !== undefined) campaign.status = status;

    // Update purchase campaign settings
    if (purchaseCampaignType !== undefined) campaign.purchaseCampaignType = purchaseCampaignType;
    if (selectedPurchaseRecipients !== undefined) campaign.selectedPurchaseRecipients = selectedPurchaseRecipients;
    if (purchaseFilter !== undefined) campaign.purchaseFilter = purchaseFilter;
    if (purchaseLinkText !== undefined) campaign.purchaseLinkText = purchaseLinkText;
    if (purchaseAmount !== undefined) campaign.purchaseAmount = purchaseAmount;

    console.log('💾 Saving campaign with purchase settings:', {
      purchaseCampaignType: campaign.purchaseCampaignType,
      selectedPurchaseRecipients: campaign.selectedPurchaseRecipients,
      purchaseFilter: campaign.purchaseFilter,
      purchaseLinkText: campaign.purchaseLinkText,
      purchaseAmount: campaign.purchaseAmount
    });

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete a campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Send manual email
router.post('/:id/send', auth, async (req, res) => {
  try {
    const result = await emailCampaignEngine.sendManualEmail(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle user behavior (open, click, idle)
router.post('/:id/behavior', async (req, res) => {
  try {
    const { userEmail, behavior } = req.body;
    
    if (!userEmail || !behavior) {
      return res.status(400).json({ error: 'userEmail and behavior are required' });
    }
    
    if (!['open', 'click', 'idle'].includes(behavior)) {
      return res.status(400).json({ error: 'behavior must be open, click, or idle' });
    }
    
    const result = await emailCampaignEngine.handleUserBehavior(req.params.id, userEmail, behavior);
    
    if (result.success) {
      res.json({
        message: result.message,
        followUpSent: result.followUpSent,
        behavior: behavior,
        userEmail: userEmail
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error handling behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test behavior trigger manually (for debugging)
router.post('/:id/test-behavior', auth, async (req, res) => {
  try {
    const { userEmail, behavior } = req.body;
    
    if (!userEmail || !behavior) {
      return res.status(400).json({ error: 'userEmail and behavior are required' });
    }
    
    if (!['open', 'click', 'idle'].includes(behavior)) {
      return res.status(400).json({ error: 'behavior must be open, click, or idle' });
    }
    
    const result = await emailCampaignEngine.testBehaviorTrigger(req.params.id, userEmail, behavior);
    
    res.json({
      success: result.success,
      message: result.message,
      followUpSent: result.followUpSent,
      behavior: behavior,
      userEmail: userEmail
    });
  } catch (error) {
    console.error('Error testing behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add recipient to campaign
router.post('/:id/recipients', auth, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const campaign = await emailCampaignEngine.addRecipient(req.params.id, email, name);
    res.json(campaign);
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove recipient from campaign
router.delete('/:id/recipients/:email', auth, async (req, res) => {
  try {
    const campaign = await emailCampaignEngine.removeRecipient(req.params.id, req.params.email);
    res.json(campaign);
  } catch (error) {
    console.error('Error removing recipient:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaign analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const analytics = await emailCampaignEngine.getCampaignAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaign templates
router.get('/templates/list', auth, async (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome-email',
        name: 'Welcome Email',
        description: 'Simple welcome email for new subscribers',
        emailTemplate: {
          subject: 'Welcome to our community!',
          body: 'Thank you for joining us. We\'re excited to have you on board!',
          senderName: 'Your Company'
        },
        timeDelayTrigger: { enabled: false },
        behaviorTriggers: []
      },
      {
        id: 'follow-up-email',
        name: 'Follow-up Email',
        description: 'Follow-up email sent after user opens previous email',
        emailTemplate: {
          subject: 'Welcome to our community!',
          body: 'Thank you for joining us. We\'re excited to have you on board!',
          senderName: 'Your Company'
        },
        timeDelayTrigger: { enabled: false },
        behaviorTriggers: [
          {
            behavior: 'open',
            enabled: true,
            followUpEmail: {
              subject: 'We noticed you opened our email!',
              body: 'Thanks for engaging with our content. Here\'s something special for you!'
            }
          }
        ]
      },
      {
        id: 'reminder-email',
        name: 'Reminder Email',
        description: 'Reminder email sent after 3 days of inactivity',
        emailTemplate: {
          subject: 'Welcome to our community!',
          body: 'Thank you for joining us. We\'re excited to have you on board!',
          senderName: 'Your Company'
        },
        timeDelayTrigger: {
          enabled: true,
          days: 3,
          hours: 0,
          minutes: 0,
          followUpEmail: {
            subject: 'We miss you!',
            body: 'It\'s been a while since we heard from you. Come back and see what\'s new!'
          }
        },
        behaviorTriggers: []
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Test email service
router.post('/test-email', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }

    const emailData = {
      to,
      subject,
      body
    };

    const result = await emailService.sendEmail(emailData);
    res.json({ 
      message: 'Test email sent successfully', 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Note: Old trigger checking methods removed - now using Redis/BullMQ queues
// Triggers are automatically scheduled when emails are sent

// Test endpoint to check campaign configuration
router.get('/test-config/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const config = {
      name: campaign.name,
      status: campaign.status,
      timeDelayTrigger: campaign.timeDelayTrigger,
      recipients: campaign.recipients.map(r => ({
        email: r.email,
        status: r.status,
        manualEmailSentAt: r.manualEmailSentAt,
        timeDelayEmailSent: r.timeDelayEmailSent
      }))
    };

    res.json(config);
  } catch (error) {
    console.error('Error getting campaign config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test open behavior manually (for debugging)
router.post('/:id/test-open/:userEmail', auth, async (req, res) => {
  try {
    const { id, userEmail } = req.params;
    const decodedEmail = decodeURIComponent(userEmail);
    
    console.log('🧪 MANUAL OPEN TEST:');
    console.log(`📧 Campaign ID: ${id}`);
    console.log(`📧 User Email: ${decodedEmail}`);
    
    const result = await emailCampaignEngine.handleUserBehavior(id, decodedEmail, 'open');
    
    res.json({
      success: result.success,
      message: result.message,
      followUpSent: result.followUpSent,
      behavior: 'open',
      userEmail: decodedEmail
    });
  } catch (error) {
    console.error('Error testing open behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

// Automatic tracking endpoints (no authentication required)
// Track email opens
router.get('/track/open/:campaignId/:userEmail', async (req, res) => {
  try {
    const { campaignId, userEmail } = req.params;
    const decodedEmail = decodeURIComponent(userEmail);
    
    console.log('🔍 OPEN TRACKING CALLED:');
    console.log(`📧 Campaign ID: ${campaignId}`);
    console.log(`📧 User Email: ${decodedEmail}`);
    console.log(`📧 Full URL: ${req.originalUrl}`);
    
    // Check if campaign exists and has open behavior trigger
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      console.log(`❌ Campaign ${campaignId} not found`);
    } else {
      console.log(`📧 Campaign found: ${campaign.name}`);
      console.log(`📧 Campaign status: ${campaign.status}`);
      console.log(`📧 Behavior triggers:`, campaign.behaviorTriggers);
      
      const openTrigger = campaign.behaviorTriggers.find(t => t.behavior === 'open' && t.enabled);
      if (openTrigger) {
        console.log(`✅ Open behavior trigger found:`, openTrigger);
        console.log(`📧 Open-up email subject: ${openTrigger.followUpEmail?.subject}`);
      } else {
        console.log(`⚠️ No enabled open behavior trigger found`);
      }
    }
    
    // Automatically trigger open behavior
    const result = await emailCampaignEngine.handleUserBehavior(campaignId, decodedEmail, 'open');
    
    console.log(`📧 Behavior result:`, result);
    
    if (result.success) {
      console.log(`✅ Open behavior processed for ${decodedEmail}`);
      if (result.followUpSent) {
        console.log(`📧 Follow-up email sent for open behavior to ${decodedEmail}`);
      } else {
        console.log(`⚠️ No follow-up email configured for open behavior`);
      }
    } else {
      console.log(`❌ Open behavior failed: ${result.message}`);
    }
    
    // Return a 1x1 transparent pixel
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
    
  } catch (error) {
    console.error('❌ Error tracking email open:', error);
    // Still return the pixel even if there's an error
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
  }
});

// Track purchase page visits (for idle tracking)
router.get('/track/purchase-page-visit/:campaignId/:userEmail', async (req, res) => {
  try {
    const { campaignId, userEmail } = req.params;
    const decodedEmail = decodeURIComponent(userEmail);
    
    console.log(`🛒 Purchase page visit tracked via pixel: ${decodedEmail} in campaign ${campaignId}`);
    
    // Track purchase page visit as "purchasePageVisit" behavior
    const result = await emailCampaignEngine.handleUserBehavior(campaignId, decodedEmail, 'purchasePageVisit');
    
    if (result.success) {
      console.log(`✅ Purchase page visit tracked for ${decodedEmail}`);
    }
    
    // Return a 1x1 transparent pixel
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': '43'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    
  } catch (error) {
    console.error('Error tracking purchase page visit:', error);
    // Return a 1x1 transparent pixel even on error
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': '43'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
});

// Track email clicks
router.get('/track/click/:campaignId/:userEmail', async (req, res) => {
  try {
    const { campaignId, userEmail } = req.params;
    const { url } = req.query;
    const decodedEmail = decodeURIComponent(userEmail);
    const decodedUrl = url ? decodeURIComponent(url) : '';
    
    console.log(`🔗 Email clicked: ${decodedEmail} in campaign ${campaignId}, URL: ${decodedUrl}`);
    
    // Automatically trigger click behavior
    const result = await emailCampaignEngine.handleUserBehavior(campaignId, decodedEmail, 'click');
    
    if (result.success) {
      console.log(`✅ Click behavior processed for ${decodedEmail}`);
      if (result.followUpSent) {
        console.log(`📧 Follow-up email sent for click behavior to ${decodedEmail}`);
      }
    }
    
    // Redirect to the original URL
    if (decodedUrl) {
      res.redirect(decodedUrl);
    } else {
      res.redirect('/');
    }
    
  } catch (error) {
    console.error('Error tracking email click:', error);
    // Redirect to home page if there's an error
    res.redirect('/');
  }
});

// Test endpoint to simulate opens, clicks, and purchases for debugging
router.post('/:id/test-interactions', auth, async (req, res) => {
  try {
    const { recipientEmail, action, purchaseAmount, purchaseCurrency } = req.body; // action can be 'open', 'click', or 'purchase'
    
    console.log(`🧪 Testing ${action} for ${recipientEmail} in campaign ${req.params.id}`);
    
    if (action === 'purchase') {
      // For purchase actions, we need to pass additional data
      const result = await emailCampaignEngine.handleUserBehavior(req.params.id, recipientEmail, action, {
        purchaseAmount: purchaseAmount || 0,
        purchaseCurrency: purchaseCurrency || 'USD'
      });
      res.json({ success: true, result });
    } else {
      const result = await emailCampaignEngine.handleUserBehavior(req.params.id, recipientEmail, action);
      res.json({ success: true, result });
    }
  } catch (error) {
    console.error('Error testing interactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track purchases (for e-commerce integration)
router.post('/:id/track-purchase', async (req, res) => {
  try {
    const { userEmail, purchaseAmount, purchaseCurrency, orderId } = req.body;
    
    console.log(`🛒 Purchase tracked: ${userEmail} in campaign ${req.params.id}, Amount: ${purchaseAmount} ${purchaseCurrency}, Order: ${orderId}`);
    
    // Find the campaign
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Send "Thank you for purchasing" email
    const thankYouEmail = {
      subject: `Thank you for your purchase! - ${campaign.name}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2ecc71;">🎉 Thank You for Your Purchase!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 15px;">Order Confirmation</h2>
            <p><strong>Product:</strong> ${campaign.name}</p>
            <p><strong>Amount:</strong> $${purchaseAmount} ${purchaseCurrency}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333;">What happens next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>You will receive your product within 3-5 business days</li>
              <li>We'll send you tracking information once your order ships</li>
              <li>Our support team is available 24/7 if you need assistance</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">Thank you for choosing us!</p>
            <p style="color: #666;">Best regards,<br>The ${campaign.name} Team</p>
          </div>
        </div>
      `
    };

    // Send the thank you email
    const emailService = require('../services/emailService');
    await emailService.sendEmail({
      to: userEmail,
      subject: thankYouEmail.subject,
      body: thankYouEmail.body
    });

    console.log(`📧 Thank you email sent to ${userEmail}`);
    
    // Trigger purchase behavior with purchase data
    const result = await emailCampaignEngine.handleUserBehavior(req.params.id, userEmail, 'purchase', {
      purchaseAmount: purchaseAmount || 0,
      purchaseCurrency: purchaseCurrency || 'USD',
      orderId: orderId
    });
    
    if (result.success) {
      console.log(`✅ Purchase behavior processed for ${userEmail}`);
      if (result.followUpSent) {
        console.log(`📧 Follow-up email sent for purchase behavior to ${userEmail}`);
      }
    }
    
    res.json({ success: true, message: 'Purchase tracked successfully and thank you email sent', result });
  } catch (error) {
    console.error('Error tracking purchase:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track purchase page abandonment
router.post('/:id/track-abandonment', async (req, res) => {
  try {
    const { userEmail, timeSpent, pageUrl } = req.body;
    
    console.log(`🚪 Purchase abandonment tracked: ${userEmail} in campaign ${req.params.id}, Time spent: ${timeSpent}s`);
    
    // Find the campaign
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Find the recipient and update abandonment data
    const recipient = campaign.recipients.find(r => r.email === userEmail);
    if (recipient && recipient.manualEmails && recipient.manualEmails.length > 0) {
      const latestEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
      latestEmail.purchasePageAbandoned = true;
      latestEmail.purchasePageTimeSpent = timeSpent;
      latestEmail.purchasePageAbandonedAt = new Date();
      
      // Update campaign analytics
      campaign.analytics.totalAbandonments = (campaign.analytics.totalAbandonments || 0) + 1;
      
      await campaign.save();
      console.log(`📊 Purchase abandonment recorded for ${userEmail}, Time spent: ${timeSpent}s`);
    }

    // Check for abandonment follow-up trigger
    const abandonmentTrigger = campaign.behaviorTriggers.find(t => 
      t.behavior === 'abandonment' && t.enabled
    );

    if (abandonmentTrigger && abandonmentTrigger.followUpEmail) {
      console.log(`📧 Sending abandonment follow-up email to ${userEmail}`);
      
      const emailService = require('../services/emailService');
      await emailService.sendEmail({
        to: userEmail,
        subject: abandonmentTrigger.followUpEmail.subject || 'Don\'t miss out on this amazing offer!',
        body: abandonmentTrigger.followUpEmail.body || `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">⏰ Limited Time Offer!</h1>
            <p>We noticed you were interested in our product but didn't complete your purchase.</p>
            <p>Don't miss out on this amazing opportunity!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${pageUrl}" style="
                display: inline-block;
                background: linear-gradient(45deg, #e74c3c, #c0392b);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: bold;
              ">
                🛒 Complete Your Purchase Now
              </a>
            </div>
          </div>
        `
      });
      
      console.log(`✅ Abandonment follow-up email sent to ${userEmail}`);
    }
    
    res.json({ success: true, message: 'Abandonment tracked successfully' });
  } catch (error) {
    console.error('Error tracking abandonment:', error);
    res.status(500).json({ error: error.message });
  }
});





// Check queue status
router.get('/queue-status', auth, async (req, res) => {
  try {
    const queueManager = require('../services/queueManager');
    const stats = await queueManager.getQueueStats();
    
    res.json({
      success: true,
      queueStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check campaign analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      analytics: campaign.analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email sending (for debugging)
router.post('/test-email', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }
    
    const emailService = require('../services/emailService');
    const result = await emailService.sendEmail({ to, subject, body });
    
    res.json({ 
      success: true,
      message: 'Test email sent successfully', 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test behavior triggers (for debugging)
router.post('/test-behavior-triggers', auth, async (req, res) => {
  try {
    const { campaignId, userEmail, behavior } = req.body;
    
    if (!campaignId || !userEmail || !behavior) {
      return res.status(400).json({ error: 'Campaign ID, user email, and behavior are required' });
    }
    
    const emailCampaignEngine = require('../services/emailCampaignEngine');
    const result = await emailCampaignEngine.handleUserBehavior(campaignId, userEmail, behavior);
    
    res.json({ 
      success: true,
      message: 'Behavior trigger test completed', 
      result 
    });
  } catch (error) {
    console.error('Error testing behavior triggers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test worker processing (for debugging)
router.post('/test-worker', auth, async (req, res) => {
  try {
    const { testType = 'idle' } = req.body;
    
    console.log(`🧪 Testing ${testType} worker processing...`);
    
    const queueManager = require('../services/queueManager');
    
    if (testType === 'idle') {
      // Test idle worker with immediate execution - use a real active campaign ID
      const campaign = await EmailCampaign.findOne({ status: 'active' });
      if (!campaign) {
        return res.status(400).json({ error: 'No active campaigns found for testing' });
      }
      
      if (!campaign.recipients || campaign.recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients found in campaign for testing' });
      }
      
      const testRecipient = campaign.recipients[0].email;
      const job = await queueManager.scheduleIdleTimeTrigger(
        campaign._id.toString(),
        testRecipient,
        0,
        2000 // 2 second delay
      );
      
      console.log(`🧪 Test idle job scheduled: ${job.id}`);
      
      // Wait a bit and check queue status
      setTimeout(async () => {
        try {
          const stats = await queueManager.getQueueStats();
          console.log('📊 Queue stats after test job:', JSON.stringify(stats, null, 2));
        } catch (error) {
          console.error('❌ Error getting queue stats:', error);
        }
      }, 3000);
      
    } else if (testType === 'timeDelay') {
      // Test time delay worker with immediate execution - use a real active campaign ID
      const campaign = await EmailCampaign.findOne({ status: 'active' });
      if (!campaign) {
        return res.status(400).json({ error: 'No active campaigns found for testing' });
      }
      
      if (!campaign.recipients || campaign.recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients found in campaign for testing' });
      }
      
      const testRecipient = campaign.recipients[0].email;
      const job = await queueManager.scheduleTimeDelayTrigger(
        campaign._id.toString(),
        testRecipient,
        0,
        2000 // 2 second delay
      );
      
      console.log(`🧪 Test time delay job scheduled: ${job.id}`);
      
      // Wait a bit and check queue status
      setTimeout(async () => {
        try {
          const stats = await queueManager.getQueueStats();
          console.log('📊 Queue stats after time delay test job:', JSON.stringify(stats, null, 2));
        } catch (error) {
          console.error('❌ Error getting queue stats:', error);
        }
      }, 3000);
    }
    
    res.json({
      success: true,
      message: `${testType} worker test job scheduled with 2 second delay`,
      testType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing worker:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test worker status
router.get('/worker-status', auth, async (req, res) => {
  try {
    const queueManager = require('../services/queueManager');
    const stats = await queueManager.getQueueStats();
    
    // Check if workers are running
    const { redis } = require('../config/redis');
    
    res.json({
      success: true,
      redisStatus: redis.status,
      queueStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting worker status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check campaign purchase settings
router.get('/:id/purchase-settings', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      purchaseSettings: {
        purchaseCampaignType: campaign.purchaseCampaignType,
        selectedPurchaseRecipients: campaign.selectedPurchaseRecipients,
        purchaseFilter: campaign.purchaseFilter,
        purchaseLinkText: campaign.purchaseLinkText,
        purchaseAmount: campaign.purchaseAmount
      },
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        recipientsCount: campaign.recipients?.length || 0
      }
    });
  } catch (error) {
    console.error('Error getting purchase settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send purchase campaign to selected recipients
router.post('/:id/send-purchase-campaign', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Debug: Log campaign purchase settings
    console.log('🔍 Campaign purchase settings:', {
      purchaseCampaignType: campaign.purchaseCampaignType,
      selectedPurchaseRecipients: campaign.selectedPurchaseRecipients,
      purchaseFilter: campaign.purchaseFilter,
      purchaseLinkText: campaign.purchaseLinkText,
      purchaseAmount: campaign.purchaseAmount
    });

    console.log('🔍 Campaign ID:', req.params.id);
    console.log('🔍 Campaign name:', campaign.name);
    console.log('🔍 Campaign status:', campaign.status);

    if (!campaign.purchaseCampaignType) {
      console.log('❌ purchaseCampaignType is undefined or null');
      return res.status(400).json({ error: 'Purchase campaign type not configured' });
    }

    if (campaign.purchaseCampaignType === 'none') {
      console.log('❌ purchaseCampaignType is set to "none"');
      return res.status(400).json({ error: 'No purchase campaign configured' });
    }

    let targetRecipients = [];

    // Determine target recipients based on campaign type
    switch (campaign.purchaseCampaignType) {
      case 'all':
        targetRecipients = campaign.recipients.filter(r => r.status === 'active');
        break;

      case 'selected':
        if (!campaign.selectedPurchaseRecipients || campaign.selectedPurchaseRecipients.length === 0) {
          return res.status(400).json({ error: 'No recipients selected for purchase campaign' });
        }
        targetRecipients = campaign.recipients.filter(r => 
          r.status === 'active' && campaign.selectedPurchaseRecipients.includes(r.email)
        );
        break;

      case 'filtered':
        targetRecipients = await getFilteredRecipients(campaign);
        if (targetRecipients.length === 0) {
          return res.status(400).json({ error: 'No recipients match the filter criteria' });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid purchase campaign type' });
    }

    console.log(`🛒 Sending purchase campaign to ${targetRecipients.length} recipients`);

    // Send purchase emails to target recipients
    const emailService = require('../services/emailService');
    const baseUrl = process.env.BASE_URL || 'https://delight-loop.onrender.com';
    
    let sentCount = 0;
    const failedEmails = [];

    for (const recipient of targetRecipients) {
      try {
        // Create purchase email content
        const purchaseEmailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">${campaign.name}</h1>
            <p style="color: #666; line-height: 1.6;">
              Hi ${recipient.name || 'there'},<br><br>
              We have an exclusive offer just for you!
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #2ecc71; margin-top: 0;">Special Offer</h2>
              <p style="color: #666;">
                ${campaign.description || 'Check out our amazing product!'}
              </p>
              <p style="font-size: 24px; color: #2ecc71; font-weight: bold; margin: 20px 0;">
                $${campaign.purchaseAmount || 99.99}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Don't miss out on this limited-time offer!
            </p>
          </div>
        `;

        console.log('📧 Purchase email content created for:', recipient.email);
        console.log('📧 Campaign purchase settings:', {
          purchaseCampaignType: campaign.purchaseCampaignType,
          purchaseLinkText: campaign.purchaseLinkText,
          purchaseAmount: campaign.purchaseAmount
        });

        // Add tracking and purchase button
        const trackedEmailContent = emailService.addTrackingToEmail(
          purchaseEmailContent,
          campaign._id.toString(),
          recipient.email,
          baseUrl,
          {
            purchaseCampaignType: campaign.purchaseCampaignType,
            purchaseLinkText: campaign.purchaseLinkText,
            purchaseAmount: campaign.purchaseAmount
          }
        );

        // Send the email
        await emailService.sendEmail({
          to: recipient.email,
          subject: `Special Offer - ${campaign.name}`,
          body: trackedEmailContent
        });

        // Add to manual emails array for idle trigger tracking
        if (!recipient.manualEmails) {
          recipient.manualEmails = [];
        }
        recipient.manualEmails.push({
          sentAt: new Date(),
          hasLinks: true, // Purchase emails always have links (purchase button)
          timeDelayEmailSent: false,
          idleEmailSent: false,
          openFollowUpSent: false,
          clickFollowUpSent: false,
          purchaseFollowUpSent: false,
          opened: false,
          clicked: false,
          purchased: false
        });

        // Update recipient's purchase campaign status
        if (!recipient.purchaseCampaigns) {
          recipient.purchaseCampaigns = [];
        }
        recipient.purchaseCampaigns.push({
          sentAt: new Date(),
          campaignType: campaign.purchaseCampaignType,
          purchaseAmount: campaign.purchaseAmount,
          purchaseLinkText: campaign.purchaseLinkText
        });

        sentCount++;
        console.log(`✅ Purchase email sent to ${recipient.email}`);
        
        // Update campaign analytics
        campaign.analytics.totalSent = (campaign.analytics.totalSent || 0) + 1;

      } catch (error) {
        console.error(`❌ Failed to send purchase email to ${recipient.email}:`, error);
        failedEmails.push(recipient.email);
      }
    }

    // Save campaign with updated recipient data BEFORE scheduling triggers
    console.log(`💾 Saving campaign with updated recipient data...`);
    await campaign.save();
    console.log(`✅ Campaign saved successfully`);

    // Now schedule triggers for all successfully sent emails
    console.log(`⏰ Scheduling triggers for all sent emails...`);
    for (const recipient of targetRecipients) {
      try {
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          const manualEmailIndex = recipient.manualEmails.length - 1;
          const emailCampaignEngine = require('../services/emailCampaignEngine');
          await emailCampaignEngine.scheduleTriggersForManualEmail(campaign._id.toString(), recipient.email, manualEmailIndex);
          
          console.log(`⏰ Scheduled triggers for purchase email to ${recipient.email} (manual email index: ${manualEmailIndex})`);
          
          // Log idle trigger status
          const idleTriggers = campaign.behaviorTriggers.filter(t => 
            t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
          );
          if (idleTriggers.length > 0) {
            const idleTrigger = idleTriggers[0];
            console.log(`⏰ Idle trigger configured: ${idleTrigger.idleTime.minutes} minutes for ${recipient.email}`);
            console.log(`⏰ If user doesn't open/click within ${idleTrigger.idleTime.minutes} minutes, idle reminder will be sent`);
          } else {
            console.log(`⚠️ No idle trigger configured for ${recipient.email} - no idle reminders will be sent`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to schedule triggers for ${recipient.email}:`, error);
      }
    }

    console.log(`📧 Purchase campaign completed. Sent: ${sentCount}, Failed: ${failedEmails.length}`);
    
    // Summary of triggers scheduled
    const idleTriggers = campaign.behaviorTriggers.filter(t => 
      t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
    );
    const timeDelayTriggers = campaign.timeDelayTrigger?.enabled;
    
    console.log(`⏰ Trigger Summary:`);
    console.log(`   📧 Purchase emails sent: ${sentCount}`);
    console.log(`   ⏰ Idle triggers configured: ${idleTriggers.length > 0 ? 'Yes' : 'No'}`);
    if (idleTriggers.length > 0) {
      console.log(`   ⏰ Idle time: ${idleTriggers[0].idleTime.minutes} minutes`);
    }
    console.log(`   ⏰ Time delay triggers: ${timeDelayTriggers ? 'Yes' : 'No'}`);
    console.log(`   🎯 Next: Users will receive idle reminders if they don't open/click within the configured time`);

    res.json({
      success: true,
      message: `Purchase campaign sent to ${sentCount} recipients`,
      sentCount,
      failedEmails,
      totalRecipients: targetRecipients.length,
      triggersScheduled: {
        idleTriggers: idleTriggers.length,
        timeDelayTriggers: timeDelayTriggers ? 1 : 0,
        idleTimeMinutes: idleTriggers.length > 0 ? idleTriggers[0].idleTime.minutes : null
      }
    });

  } catch (error) {
    console.error('Error sending purchase campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get filtered recipients
async function getFilteredRecipients(campaign) {
  const filter = campaign.purchaseFilter;
  const recipients = campaign.recipients.filter(r => r.status === 'active');

  switch (filter.type) {
    case 'opens':
      return recipients.filter(r => 
        r.manualEmails && r.manualEmails.some(email => email.opened)
      );

    case 'clicks':
      return recipients.filter(r => 
        r.manualEmails && r.manualEmails.some(email => email.clicked)
      );

    case 'purchases':
      return recipients.filter(r => 
        r.manualEmails && r.manualEmails.some(email => email.purchased)
      );

    case 'inactive':
      return recipients.filter(r => 
        !r.manualEmails || r.manualEmails.every(email => !email.opened && !email.clicked)
      );

    case 'new':
      return recipients.filter(r => 
        !r.manualEmails || r.manualEmails.length === 0
      );

    default:
      return recipients;
  }
}

// Send manual email to specific recipients
router.post('/:id/send-to-recipients', auth, async (req, res) => {
  try {
    const { recipientEmails } = req.body;
    
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({ error: 'recipientEmails array is required' });
    }
    
    console.log(`📧 Sending manual email to specific recipients: ${recipientEmails.join(', ')}`);
    
    const result = await emailCampaignEngine.sendManualEmailToRecipients(req.params.id, recipientEmails);
    res.json(result);
  } catch (error) {
    console.error('Error sending manual email to specific recipients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get queue statistics
router.get('/queue/stats', auth, async (req, res) => {
  try {
    const stats = await queueManager.getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Clean up old jobs
router.post('/queue/cleanup', auth, async (req, res) => {
  try {
    await queueManager.cleanupJobs();
    res.json({ message: 'Queue cleanup completed' });
  } catch (error) {
    console.error('Error cleaning up jobs:', error);
    res.status(500).json({ error: 'Failed to cleanup jobs' });
  }
});

// Purchase page route - when users click purchase link from email
router.get('/purchase/:campaignId/:userEmail', async (req, res) => {
  try {
    const { campaignId, userEmail } = req.params;
    const decodedEmail = decodeURIComponent(userEmail);
    
    console.log(`🛒 Purchase page accessed: ${decodedEmail} in campaign ${campaignId}`);
    
    // Find the campaign
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).send(`
        <html>
          <head><title>Campaign Not Found</title></head>
          <body>
            <h1>Campaign Not Found</h1>
            <p>The campaign you're looking for doesn't exist.</p>
          </body>
        </html>
      `);
    }

    // Find the recipient
    const recipient = campaign.recipients.find(r => r.email === decodedEmail);
    if (!recipient) {
      return res.status(404).send(`
        <html>
          <head><title>Recipient Not Found</title></head>
          <body>
            <h1>Recipient Not Found</h1>
            <p>You are not registered for this campaign.</p>
          </body>
        </html>
      `);
    }

    // Track purchase page visit as "open" behavior
    try {
      const emailCampaignEngine = require('../services/emailCampaignEngine');
      await emailCampaignEngine.handleUserBehavior(campaignId, decodedEmail, 'open');
      console.log(`📊 Purchase page visit tracked as open for ${decodedEmail}`);
    } catch (error) {
      console.error('❌ Error tracking purchase page visit:', error);
    }

    // Generate purchase page HTML
    const purchasePageHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Product - ${campaign.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .product-image {
            width: 200px;
            height: 200px;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .product-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
          }
          .product-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .price {
            font-size: 32px;
            color: #2ecc71;
            font-weight: bold;
            margin-bottom: 30px;
          }
          .purchase-button {
            background: linear-gradient(45deg, #2ecc71, #27ae60);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 50px;
            cursor: pointer;
            transition: transform 0.2s;
            margin-bottom: 20px;
          }
          .purchase-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
          }
          .purchase-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
          }
          .features {
            text-align: left;
            margin: 30px 0;
          }
          .features h3 {
            color: #333;
            margin-bottom: 15px;
          }
          .features ul {
            list-style: none;
            padding: 0;
          }
          .features li {
            padding: 8px 0;
            color: #666;
            position: relative;
            padding-left: 25px;
          }
          .features li:before {
            content: "✓";
            color: #2ecc71;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          .success-message {
            display: none;
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .error-message {
            display: none;
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="product-image">PRODUCT</div>
          <h1 class="product-title">${campaign.name}</h1>
          <p class="product-description">
            ${campaign.description || 'Amazing product that will transform your life!'}
          </p>
          <div class="price">$99.99</div>
          
          <button class="purchase-button" onclick="handlePurchase()" id="purchaseBtn">
            Purchase Now
          </button>
          
          <div class="features">
            <h3>What you'll get:</h3>
            <ul>
              <li>Premium quality product</li>
              <li>Fast worldwide shipping</li>
              <li>30-day money-back guarantee</li>
              <li>24/7 customer support</li>
              <li>Exclusive bonus content</li>
            </ul>
          </div>
          
          <div class="success-message" id="successMessage">
            <strong>Thank you for your purchase!</strong><br>
            You will receive a confirmation email shortly.
          </div>
          
          <div class="error-message" id="errorMessage">
            <strong>Purchase failed!</strong><br>
            Please try again or contact support.
          </div>
        </div>

        <!-- Tracking pixel for purchase page visit (for idle tracking) -->
        <img src="${process.env.BASE_URL || 'https://delight-loop.onrender.com'}/api/campaigns/track/purchase-page-visit/${campaignId}/${encodeURIComponent(decodedEmail)}" 
             width="1" height="1" style="display:none;" alt="" />

        <script>
          let pageLoadTime = Date.now();
          let timeSpent = 0;
          let hasInteracted = false;
          let abandonmentTracked = false;

          // Track time spent on page
          function updateTimeSpent() {
            timeSpent = Math.floor((Date.now() - pageLoadTime) / 1000);
          }

          // Track abandonment when user leaves
          function trackAbandonment() {
            if (!abandonmentTracked && !hasInteracted) {
              abandonmentTracked = true;
              updateTimeSpent();
              
              fetch('/api/campaigns/${campaignId}/track-abandonment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userEmail: '${decodedEmail}',
                  timeSpent: timeSpent,
                  pageUrl: window.location.href
                })
              }).catch(error => console.error('Abandonment tracking error:', error));
            }
          }

          // Track interactions
          document.addEventListener('click', function() {
            hasInteracted = true;
          });

          document.addEventListener('scroll', function() {
            hasInteracted = true;
          });

          // Track when user leaves the page
          window.addEventListener('beforeunload', trackAbandonment);
          window.addEventListener('pagehide', trackAbandonment);

          // Update time spent every 5 seconds
          setInterval(updateTimeSpent, 5000);

          async function handlePurchase() {
            const button = document.getElementById('purchaseBtn');
            const successMsg = document.getElementById('successMessage');
            const errorMsg = document.getElementById('errorMessage');
            
            // Mark as interacted to prevent abandonment tracking
            hasInteracted = true;
            
            // Disable button and show loading
            button.disabled = true;
            button.textContent = 'Processing...';
            successMsg.style.display = 'none';
            errorMsg.style.display = 'none';
            
            try {
              const response = await fetch('/api/campaigns/${campaignId}/track-purchase', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userEmail: '${decodedEmail}',
                  purchaseAmount: 99.99,
                  purchaseCurrency: 'USD',
                  orderId: 'ORD-' + Date.now(),
                  timeSpent: timeSpent
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                successMsg.style.display = 'block';
                button.textContent = 'Purchased!';
                button.style.background = '#27ae60';
                
                // Redirect to thank you page after 3 seconds
                setTimeout(() => {
                  window.location.href = '/api/campaigns/thank-you/${campaignId}/${encodeURIComponent(decodedEmail)}';
                }, 3000);
              } else {
                throw new Error(result.error || 'Purchase failed');
              }
            } catch (error) {
              console.error('Purchase error:', error);
              errorMsg.style.display = 'block';
              button.disabled = false;
              button.textContent = 'Purchase Now';
            }
          }
        </script>
      </body>
      </html>
    `;

    res.send(purchasePageHtml);
    
  } catch (error) {
    console.error('❌ Error serving purchase page:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>Something went wrong. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// Thank you page after purchase
router.get('/thank-you/:campaignId/:userEmail', async (req, res) => {
  try {
    const { campaignId, userEmail } = req.params;
    const decodedEmail = decodeURIComponent(userEmail);
    
    const thankYouHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Your Purchase!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            text-align: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success-icon {
            font-size: 80px;
            color: #2ecc71;
            margin-bottom: 20px;
          }
          .title {
            font-size: 32px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .order-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
          }
          .order-details h3 {
            color: #333;
            margin-bottom: 15px;
          }
          .order-details p {
            margin: 5px 0;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1 class="title">Thank You for Your Purchase!</h1>
          <p class="message">
            Your order has been successfully processed. You will receive a confirmation email shortly with all the details.
          </p>
          
          <div class="order-details">
            <h3>Order Summary:</h3>
            <p><strong>Product:</strong> Campaign Product</p>
            <p><strong>Amount:</strong> $99.99 USD</p>
            <p><strong>Order ID:</strong> ORD-${Date.now()}</p>
            <p><strong>Email:</strong> ${decodedEmail}</p>
          </div>
          
          <p class="message">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </body>
      </html>
    `;

    res.send(thankYouHtml);
    
  } catch (error) {
    console.error('❌ Error serving thank you page:', error);
    res.status(500).send('Error loading thank you page');
  }
});

module.exports = router; 