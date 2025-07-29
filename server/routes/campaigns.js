const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const EmailCampaign = require('../models/EmailCampaign');
const emailCampaignEngine = require('../services/emailCampaignEngine');
const emailService = require('../services/emailService');

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
    const { name, description, emailTemplate, timeDelayTrigger, behaviorTriggers, status } = req.body;

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
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate additional analytics
    const totalRecipients = campaign.recipients.length;
    const activeRecipients = campaign.recipients.filter(r => r.status === 'active').length;
    const recipientsWithManualEmail = campaign.recipients.filter(r => r.manualEmailSentAt).length;
    const recipientsWithTimeDelayEmail = campaign.recipients.filter(r => r.timeDelayEmailSent).length;

    const analytics = {
      ...campaign.analytics,
      totalRecipients,
      activeRecipients,
      recipientsWithManualEmail,
      recipientsWithTimeDelayEmail,
      recipients: campaign.recipients.map(r => ({
        email: r.email,
        name: r.name,
        status: r.status,
        manualEmailSentAt: r.manualEmailSentAt,
        timeDelayEmailSent: r.timeDelayEmailSent,
        lastActivity: r.lastActivity
      }))
    };

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

// Manually check time delay triggers (for testing)
router.post('/check-triggers', auth, async (req, res) => {
  try {
    console.log('🔍 Manual trigger check requested');
    await emailCampaignEngine.checkTimeTriggers();
    await emailCampaignEngine.checkIdleTimeTriggers();
    res.json({ message: 'Time delay and idle time triggers checked successfully' });
  } catch (error) {
    console.error('Error checking triggers:', error);
    res.status(500).json({ error: error.message });
  }
});

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

module.exports = router; 