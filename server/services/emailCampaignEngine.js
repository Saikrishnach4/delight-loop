const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');
const emailService = require('./emailService');

class EmailCampaignEngine {
  constructor() {
    this.processingQueue = new Map();
  }

  // Send manual email to all recipients
  async sendManualEmail(campaignId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const activeRecipients = campaign.recipients.filter(r => r.status === 'active');
      
      for (const recipient of activeRecipients) {
        await this.sendSingleEmail(campaign, recipient.email, campaign.emailTemplate);
        
        // Update recipient's last activity
        recipient.lastActivity = new Date();
      }

      // Update analytics
      campaign.analytics.totalSent += activeRecipients.length;
      await campaign.save();

      return { sent: activeRecipients.length };
    } catch (error) {
      console.error('Error sending manual email:', error);
      throw error;
    }
  }

  // Send single email
  async sendSingleEmail(campaign, recipientEmail, emailTemplate) {
    try {
      console.log(`Sending email: ${emailTemplate.subject} to ${recipientEmail}`);
      
      const emailData = {
        to: recipientEmail,
        from: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
        subject: emailTemplate.subject,
        body: emailTemplate.body
      };

      // Send email using the email service
      const result = await emailService.sendEmail(emailData);
      console.log(`Email sent successfully to ${recipientEmail}:`, result.messageId);

      return true;
    } catch (error) {
      console.error(`Error sending email to ${recipientEmail}:`, error);
      return false;
    }
  }

  // Handle user behavior (open, click, idle)
  async handleUserBehavior(campaignId, userEmail, behavior) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update recipient's last activity
      const recipient = campaign.recipients.find(r => r.email === userEmail);
      if (recipient) {
        recipient.lastActivity = new Date();
        await campaign.save();
      }

      // Update analytics
      if (behavior === 'open') {
        campaign.analytics.totalOpens += 1;
      } else if (behavior === 'click') {
        campaign.analytics.totalClicks += 1;
      }

      await campaign.save();

      // Check for behavior-based triggers
      await this.checkBehaviorTriggers(campaign, userEmail, behavior);

    } catch (error) {
      console.error('Error handling user behavior:', error);
      throw error;
    }
  }

  // Check for behavior-based triggers
  async checkBehaviorTriggers(campaign, userEmail, behavior) {
    try {
      const behaviorTrigger = campaign.behaviorTriggers.find(t => 
        t.behavior === behavior && t.enabled
      );

      if (behaviorTrigger && behaviorTrigger.followUpEmail) {
        // Send follow-up email based on behavior
        await this.sendSingleEmail(campaign, userEmail, behaviorTrigger.followUpEmail);
        
        // Update analytics
        campaign.analytics.totalSent += 1;
        await campaign.save();
      }

    } catch (error) {
      console.error('Error checking behavior triggers:', error);
    }
  }

  // Check for time-based triggers
  async checkTimeTriggers() {
    try {
      const activeCampaigns = await EmailCampaign.find({ 
        status: 'active',
        'timeDelayTrigger.enabled': true 
      });

      for (const campaign of activeCampaigns) {
        const emailsToSend = [];

        for (const recipient of campaign.recipients) {
          if (recipient.status !== 'active' || !recipient.lastActivity) continue;

          const timeSinceLastActivity = Date.now() - recipient.lastActivity.getTime();
          const triggerTime = (campaign.timeDelayTrigger.days * 24 * 60 * 60 * 1000) + 
                             (campaign.timeDelayTrigger.hours * 60 * 60 * 1000) +
                             (campaign.timeDelayTrigger.minutes * 60 * 1000);

          if (timeSinceLastActivity >= triggerTime) {
            emailsToSend.push(recipient.email);
          }
        }

        if (emailsToSend.length > 0 && campaign.timeDelayTrigger.followUpEmail) {
          for (const email of emailsToSend) {
            await this.sendSingleEmail(campaign, email, campaign.timeDelayTrigger.followUpEmail);
          }

          // Update analytics
          campaign.analytics.totalSent += emailsToSend.length;
          await campaign.save();
        }
      }
    } catch (error) {
      console.error('Error checking time triggers:', error);
    }
  }

  // Add recipient to campaign
  async addRecipient(campaignId, email, name = '') {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if recipient already exists
      const existingRecipient = campaign.recipients.find(r => r.email === email);
      if (existingRecipient) {
        throw new Error('Recipient already exists');
      }

      campaign.recipients.push({
        email,
        name,
        lastActivity: new Date(),
        status: 'active'
      });

      await campaign.save();
      return campaign;
    } catch (error) {
      console.error('Error adding recipient:', error);
      throw error;
    }
  }

  // Remove recipient from campaign
  async removeRecipient(campaignId, email) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      campaign.recipients = campaign.recipients.filter(r => r.email !== email);
      await campaign.save();
      return campaign;
    } catch (error) {
      console.error('Error removing recipient:', error);
      throw error;
    }
  }

  // Get campaign analytics
  async getCampaignAnalytics(campaignId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const analytics = {
        totalRecipients: campaign.recipients.length,
        activeRecipients: campaign.recipients.filter(r => r.status === 'active').length,
        totalSent: campaign.analytics.totalSent,
        totalOpens: campaign.analytics.totalOpens,
        totalClicks: campaign.analytics.totalClicks,
        openRate: campaign.analytics.totalSent > 0 ? 
          (campaign.analytics.totalOpens / campaign.analytics.totalSent) * 100 : 0,
        clickRate: campaign.analytics.totalSent > 0 ? 
          (campaign.analytics.totalClicks / campaign.analytics.totalSent) * 100 : 0
      };

      return analytics;
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  // Start time-based trigger checking (run this periodically)
  startTimeTriggerChecking() {
    // Check every hour
    setInterval(() => {
      this.checkTimeTriggers();
    }, 60 * 60 * 1000);
  }
}

module.exports = new EmailCampaignEngine(); 