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
      return res.status(400).json({ error: 'User email and behavior are required' });
    }

    await emailCampaignEngine.handleUserBehavior(req.params.id, userEmail, behavior);
    res.json({ message: 'Behavior recorded successfully' });
  } catch (error) {
    console.error('Error recording behavior:', error);
    res.status(500).json({ error: 'Failed to record behavior' });
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
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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

module.exports = router; 