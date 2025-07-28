const express = require('express');
const EmailCampaign = require('../models/EmailCampaign');
const emailAutomationService = require('../services/emailAutomationService');

const router = express.Router();

// Tracking pixel for email opens
router.get('/pixel/:campaignId/:subscriberEmail', async (req, res) => {
  try {
    const { campaignId, subscriberEmail } = req.params;
    
    // Find the campaign and subscriber
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
    if (!subscriber) {
      return res.status(404).send('Subscriber not found');
    }

    // Update subscriber behavior
    subscriber.behavior.opens.push(new Date());
    subscriber.lastActivity = new Date();

    // Update step history if this is the first open
    const lastStep = subscriber.stepHistory[subscriber.stepHistory.length - 1];
    if (lastStep && !lastStep.openedAt) {
      lastStep.openedAt = new Date();
      lastStep.status = 'opened';
    }

    // Update campaign analytics
    campaign.analytics.totalOpens += 1;
    campaign.analytics.openRate = (campaign.analytics.totalOpens / campaign.analytics.totalSent) * 100;

    await campaign.save();

    // Trigger automation for this subscriber
    await emailAutomationService.handleSubscriberEvent(campaignId, subscriberEmail, 'opens');

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);

  } catch (error) {
    console.error('Tracking pixel error:', error);
    // Still return a pixel even if tracking fails
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

// Click tracking for email links
router.get('/click/:campaignId/:subscriberEmail/:linkId', async (req, res) => {
  try {
    const { campaignId, subscriberEmail, linkId } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }

    // Find the campaign and subscriber
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
    if (!subscriber) {
      return res.status(404).send('Subscriber not found');
    }

    // Update subscriber behavior
    subscriber.behavior.clicks.push(new Date());
    subscriber.lastActivity = new Date();

    // Update step history if this is the first click
    const lastStep = subscriber.stepHistory[subscriber.stepHistory.length - 1];
    if (lastStep && !lastStep.clickedAt) {
      lastStep.clickedAt = new Date();
      lastStep.status = 'clicked';
    }

    // Update campaign analytics
    campaign.analytics.totalClicks += 1;
    campaign.analytics.clickRate = (campaign.analytics.totalClicks / campaign.analytics.totalOpens) * 100;

    await campaign.save();

    // Trigger automation for this subscriber
    await emailAutomationService.handleSubscriberEvent(campaignId, subscriberEmail, 'clicks');

    // Log the click for analytics
    console.log(`Click tracked: Campaign ${campaignId}, Subscriber ${subscriberEmail}, Link ${linkId}, URL ${url}`);

    // Redirect to the original URL
    res.redirect(url);

  } catch (error) {
    console.error('Click tracking error:', error);
    // Still redirect even if tracking fails
    const { url } = req.query;
    if (url) {
      res.redirect(url);
    } else {
      res.status(400).send('Invalid tracking link');
    }
  }
});

// Unsubscribe tracking
router.get('/unsubscribe/:campaignId/:subscriberEmail', async (req, res) => {
  try {
    const { campaignId, subscriberEmail } = req.params;

    // Find the campaign and subscriber
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
    if (!subscriber) {
      return res.status(404).send('Subscriber not found');
    }

    // Update subscriber status
    subscriber.status = 'unsubscribed';
    subscriber.lastActivity = new Date();

    await campaign.save();

    // Return unsubscribe confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: #4caf50; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✓ Successfully Unsubscribed</h1>
            <p>You have been successfully unsubscribed from our email list.</p>
            <p>We're sorry to see you go. If you change your mind, you can always resubscribe in the future.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
});

// Purchase tracking (for e-commerce integration)
router.post('/purchase/:campaignId/:subscriberEmail', async (req, res) => {
  try {
    const { campaignId, subscriberEmail } = req.params;
    const { amount, product, orderId } = req.body;

    // Find the campaign and subscriber
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Update subscriber behavior
    subscriber.behavior.purchases.push(new Date());
    subscriber.lastActivity = new Date();

    // Store purchase details in custom fields
    if (!subscriber.customFields.purchases) {
      subscriber.customFields.purchases = [];
    }
    subscriber.customFields.purchases.push({
      amount,
      product,
      orderId,
      date: new Date()
    });

    // Update campaign analytics
    campaign.analytics.conversionRate = (campaign.subscribers.filter(s => 
      s.behavior.purchases.length > 0
    ).length / campaign.subscribers.length) * 100;

    await campaign.save();

    // Trigger automation for this subscriber
    await emailAutomationService.handleSubscriberEvent(campaignId, subscriberEmail, 'purchases');

    res.json({ 
      success: true, 
      message: 'Purchase tracked successfully',
      conversionRate: campaign.analytics.conversionRate
    });

  } catch (error) {
    console.error('Purchase tracking error:', error);
    res.status(500).json({ error: 'Error tracking purchase' });
  }
});

// Get tracking statistics for a campaign
router.get('/stats/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const stats = {
      totalSubscribers: campaign.subscribers.length,
      activeSubscribers: campaign.subscribers.filter(s => s.status === 'active').length,
      totalOpens: campaign.analytics.totalOpens,
      totalClicks: campaign.analytics.totalClicks,
      openRate: campaign.analytics.openRate,
      clickRate: campaign.analytics.clickRate,
      conversionRate: campaign.analytics.conversionRate,
      behaviorStats: {
        opens: campaign.subscribers.reduce((sum, s) => sum + s.behavior.opens.length, 0),
        clicks: campaign.subscribers.reduce((sum, s) => sum + s.behavior.clicks.length, 0),
        purchases: campaign.subscribers.reduce((sum, s) => sum + s.behavior.purchases.length, 0)
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get tracking stats error:', error);
    res.status(500).json({ error: 'Error fetching tracking statistics' });
  }
});

module.exports = router;