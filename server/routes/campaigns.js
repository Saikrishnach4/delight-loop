const express = require('express');
const mongoose = require('mongoose');
const EmailCampaign = require('../models/EmailCampaign');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Track email open (no auth required - called from emails)
router.get('/track/open', async (req, res) => {
  try {
    const { email, campaignId, stepNumber } = req.query;
    
    if (!email || !campaignId) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const subscriber = campaign.subscribers.find(s => s.email === email);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found.' });
    }

    // Record email open
    subscriber.behavior.opens.push(new Date());
    subscriber.lastActivity = new Date();

    // Update step history
    const stepHistory = subscriber.stepHistory.find(h => h.stepNumber === parseInt(stepNumber));
    if (stepHistory) {
      stepHistory.openedAt = new Date();
      stepHistory.status = 'opened';
    }

    // Update campaign analytics
    campaign.analytics.totalOpens += 1;
    campaign.analytics.openRate = (campaign.analytics.totalOpens / campaign.analytics.totalSent) * 100;

    await campaign.save();

    // Return a 1x1 transparent pixel for email tracking
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
  } catch (error) {
    console.error('Track open error:', error);
    res.status(500).json({ error: 'Failed to track email open.' });
  }
});

// Track email click (no auth required - called from emails)
router.get('/track/click', async (req, res) => {
  try {
    const { email, campaignId, stepNumber, url } = req.query;
    
    if (!email || !campaignId || !url) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const subscriber = campaign.subscribers.find(s => s.email === email);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found.' });
    }

    // Record email click
    subscriber.behavior.clicks.push(new Date());
    subscriber.lastActivity = new Date();

    // Update step history
    const stepHistory = subscriber.stepHistory.find(h => h.stepNumber === parseInt(stepNumber));
    if (stepHistory) {
      stepHistory.clickedAt = new Date();
      stepHistory.status = 'clicked';
    }

    // Update campaign analytics
    campaign.analytics.totalClicks += 1;
    campaign.analytics.clickRate = (campaign.analytics.totalClicks / campaign.analytics.totalOpens) * 100;

    await campaign.save();

    // Redirect to the actual URL
    res.redirect(url);
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track email click.' });
  }
});

// Manual test endpoint for tracking (for testing purposes)
router.post('/test-tracking', auth, async (req, res) => {
  try {
    const { campaignId, email, action } = req.body;
    
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    let subscriber = campaign.subscribers.find(s => s.email === email);
    if (!subscriber) {
      // Create subscriber if doesn't exist
      subscriber = {
        email: email,
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
        behavior: { opens: [], clicks: [], purchases: [], lastActivity: new Date() },
        stepHistory: [],
        subscribedAt: new Date()
      };
      campaign.subscribers.push(subscriber);
    }

    // Record the action
    if (action === 'open') {
      subscriber.behavior.opens.push(new Date());
      campaign.analytics.totalOpens += 1;
    } else if (action === 'click') {
      subscriber.behavior.clicks.push(new Date());
      campaign.analytics.totalClicks += 1;
    }

    subscriber.lastActivity = new Date();
    
    // Update rates
    if (campaign.analytics.totalSent > 0) {
      campaign.analytics.openRate = (campaign.analytics.totalOpens / campaign.analytics.totalSent) * 100;
    }
    if (campaign.analytics.totalOpens > 0) {
      campaign.analytics.clickRate = (campaign.analytics.totalClicks / campaign.analytics.totalOpens) * 100;
    }

    await campaign.save();

    res.json({
      message: `${action} recorded successfully`,
      analytics: campaign.analytics,
      subscriber: {
        email: subscriber.email,
        opens: subscriber.behavior.opens.length,
        clicks: subscriber.behavior.clicks.length
      }
    });
  } catch (error) {
    console.error('Test tracking error:', error);
    res.status(500).json({ error: 'Failed to record test tracking.' });
  }
});

// Get all campaigns for current user
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({
      owner: req.user._id,
      isActive: true
    }).sort({ updatedAt: -1 });

    res.json({ campaigns });
  } catch (error) {
    console.error('Fetch campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns.' });
  }
});

// Get single campaign by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ error: 'Invalid campaign ID.' });
    }

    // Check if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign ID format.' });
    }

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Fetch campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign.' });
  }
});

// Create new campaign
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type, steps, settings } = req.body;

    const campaign = new EmailCampaign({
      name,
      description,
      owner: req.user._id,
      type,
      steps: steps || [],
      settings
    });

    await campaign.save();

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign.' });
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ error: 'Invalid campaign ID.' });
    }

    // Check if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign ID format.' });
    }

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const { name, description, type, steps, settings, status } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type) updates.type = type;
    if (steps) updates.steps = steps;
    if (settings) updates.settings = settings;
    if (status) updates.status = status;

    const updatedCampaign = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign.' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ error: 'Invalid campaign ID.' });
    }

    // Check if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign ID format.' });
    }

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    campaign.isActive = false;
    await campaign.save();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign.' });
  }
});

// Add subscribers to campaign
router.post('/:id/subscribers', auth, async (req, res) => {
  try {
    const { subscribers } = req.body;

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    // Add new subscribers
    subscribers.forEach(subscriber => {
      const existingSubscriber = campaign.subscribers.find(
        s => s.email === subscriber.email
      );

      if (!existingSubscriber) {
        campaign.subscribers.push({
          email: subscriber.email,
          firstName: subscriber.firstName || '',
          lastName: subscriber.lastName || '',
          customFields: subscriber.customFields || {}
        });
      }
    });

    await campaign.save();

    res.json({
      message: 'Subscribers added successfully',
      totalSubscribers: campaign.subscribers.length
    });
  } catch (error) {
    console.error('Add subscribers error:', error);
    res.status(500).json({ error: 'Failed to add subscribers.' });
  }
});

// Get campaign analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const analytics = {
      totalSubscribers: campaign.subscribers.length,
      activeSubscribers: campaign.subscribers.filter(s => s.status === 'active').length,
      totalSent: campaign.analytics.totalSent,
      totalOpens: campaign.analytics.totalOpens,
      totalClicks: campaign.analytics.totalClicks,
      openRate: campaign.analytics.openRate,
      clickRate: campaign.analytics.clickRate,
      conversionRate: campaign.analytics.conversionRate,
      stepAnalytics: campaign.steps.map(step => ({
        stepNumber: step.stepNumber,
        name: step.name,
        sent: campaign.subscribers.filter(s => 
          s.stepHistory.some(h => h.stepNumber === step.stepNumber)
        ).length,
        opened: campaign.subscribers.filter(s => 
          s.stepHistory.some(h => h.stepNumber === step.stepNumber && h.status === 'opened')
        ).length,
        clicked: campaign.subscribers.filter(s => 
          s.stepHistory.some(h => h.stepNumber === step.stepNumber && h.status === 'clicked')
        ).length
      }))
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics.' });
  }
});

// Test campaign
router.post('/:id/test', auth, async (req, res) => {
  try {
    const { nodes, edges } = req.body;

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    // Find the first email step
    const emailStep = campaign.steps.find(step => step.emailTemplate);
    
    if (!emailStep) {
      return res.status(400).json({ error: 'No email template found in campaign.' });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Return success with mock data when email service isn't configured
      return res.json({
        message: 'Test email would be sent (email service not configured)',
        testData: {
          nodes: nodes?.length || 0,
          edges: edges?.length || 0,
          recipient: req.user.email,
          messageId: 'mock-message-id-' + Date.now(),
          emailContent: {
            subject: emailStep.emailTemplate.subject,
            body: emailStep.emailTemplate.body
          }
        }
      });
    }

    // Send test email
    const result = await emailService.sendTestEmail(
      req.user.email,
      campaign,
      emailStep
    );

    if (result.success) {
      res.json({
        message: 'Test email sent successfully',
        testData: {
          nodes: nodes?.length || 0,
          edges: edges?.length || 0,
          recipient: req.user.email,
          messageId: result.messageId
        }
      });
    } else {
      res.status(500).json({ error: `Failed to send test email: ${result.error}` });
    }
  } catch (error) {
    console.error('Test campaign error:', error);
    res.status(500).json({ error: 'Failed to send test campaign.' });
  }
});

// Trigger campaign step for subscriber
router.post('/:id/trigger', auth, async (req, res) => {
  try {
    const { subscriberEmail, stepNumber } = req.body;

    const campaign = await EmailCampaign.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found.' });
    }

    const step = campaign.steps.find(s => s.stepNumber === stepNumber);
    if (!step) {
      return res.status(404).json({ error: 'Step not found.' });
    }

    // Add to step history
    subscriber.stepHistory.push({
      stepNumber,
      sentAt: new Date(),
      status: 'sent'
    });

    // Update analytics
    campaign.analytics.totalSent += 1;

    await campaign.save();

    res.json({
      message: 'Campaign step triggered successfully',
      step: {
        subject: step.emailTemplate.subject,
        body: step.emailTemplate.body
      }
    });
  } catch (error) {
    console.error('Trigger campaign error:', error);
    res.status(500).json({ error: 'Failed to trigger campaign step.' });
  }
});

module.exports = router; 