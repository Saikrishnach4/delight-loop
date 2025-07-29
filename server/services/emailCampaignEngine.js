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
        
        // Update recipient's last activity and manual email sent time
        recipient.lastActivity = new Date();
        recipient.manualEmailSentAt = new Date(); // Record when manual email was sent
        recipient.timeDelayEmailSent = false; // Reset time delay email flag for new cycle
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

  // Handle user behavior (open, click, idle) and send follow-up emails
  async handleUserBehavior(campaignId, userEmail, behavior) {
    try {
      console.log(`🎯 Handling user behavior: ${behavior} for ${userEmail} in campaign ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        console.log(`❌ Campaign ${campaignId} not found`);
        return { success: false, message: 'Campaign not found' };
      }

      // Find the recipient
      const recipient = campaign.recipients.find(r => r.email === userEmail);
      if (!recipient) {
        console.log(`❌ Recipient ${userEmail} not found in campaign ${campaignId}`);
        return { success: false, message: 'Recipient not found' };
      }

      // Update recipient's last activity
      recipient.lastActivity = new Date();
      
      // Update analytics
      if (behavior === 'open') {
        campaign.analytics.totalOpens += 1;
        console.log(`📊 Updated opens count for campaign ${campaign.name}`);
      } else if (behavior === 'click') {
        campaign.analytics.totalClicks += 1;
        console.log(`📊 Updated clicks count for campaign ${campaign.name}`);
      }

      // Check if there's a behavior trigger for this action
      const behaviorTrigger = campaign.behaviorTriggers.find(trigger => 
        trigger.behavior === behavior && trigger.enabled
      );

      if (behaviorTrigger && behaviorTrigger.followUpEmail) {
        console.log(`📧 Found behavior trigger for ${behavior}, sending follow-up email to ${userEmail}`);
        
        // Send the follow-up email
        await this.sendSingleEmail(campaign, userEmail, behaviorTrigger.followUpEmail);
        
        // Update analytics
        campaign.analytics.totalSent += 1;
        
        console.log(`✅ Sent ${behavior} follow-up email to ${userEmail}`);
      } else {
        console.log(`ℹ️ No behavior trigger found for ${behavior} or trigger is disabled`);
      }

      // Save the campaign
      await campaign.save();
      
      return { 
        success: true, 
        message: `Behavior ${behavior} recorded and processed`,
        followUpSent: !!behaviorTrigger?.followUpEmail
      };
      
    } catch (error) {
      console.error('❌ Error handling user behavior:', error);
      return { success: false, message: error.message };
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
      console.log('⏰ Checking time delay triggers...', new Date().toLocaleTimeString());
      
      const allCampaigns = await EmailCampaign.find({});
      console.log(`📧 Total campaigns in database: ${allCampaigns.length}`);
      
      const activeCampaigns = await EmailCampaign.find({ 
        status: 'active', 
        'timeDelayTrigger.enabled': true 
      });
      
      console.log(`📧 Found ${activeCampaigns.length} active campaigns with time delay triggers`);
      
      if (activeCampaigns.length === 0) {
        console.log('⚠️ No active campaigns with enabled time delay triggers found');
        console.log('📧 All campaigns status:', allCampaigns.map(c => ({ 
          name: c.name, 
          status: c.status, 
          timeDelayEnabled: c.timeDelayTrigger?.enabled 
        })));
        return;
      }

      for (const campaign of activeCampaigns) {
        console.log(`📧 Checking campaign: ${campaign.name}`);
        console.log(`📧 Campaign time delay config:`, {
          enabled: campaign.timeDelayTrigger.enabled,
          days: campaign.timeDelayTrigger.days,
          hours: campaign.timeDelayTrigger.hours,
          minutes: campaign.timeDelayTrigger.minutes,
          hasFollowUpEmail: !!campaign.timeDelayTrigger.followUpEmail
        });
        
        const emailsToSend = [];
        
        console.log(`📧 Campaign has ${campaign.recipients.length} recipients`);
        
        for (const recipient of campaign.recipients) {
          console.log(`📧 Checking recipient: ${recipient.email}`);
          console.log(`📧 Recipient status: ${recipient.status}, manualEmailSentAt: ${recipient.manualEmailSentAt}, timeDelayEmailSent: ${recipient.timeDelayEmailSent}`);
          
          if (recipient.status !== 'active') {
            console.log(`⏭️ Skipping ${recipient.email} - not active`);
            continue;
          }
          
          if (!recipient.manualEmailSentAt) {
            console.log(`⏭️ Skipping ${recipient.email} - no manual email sent yet`);
            continue;
          }
          
          if (recipient.timeDelayEmailSent) {
            console.log(`⏭️ Skipping ${recipient.email} - time delay email already sent`);
            continue;
          }
          
          const timeSinceManualEmail = Date.now() - recipient.manualEmailSentAt.getTime();
          const triggerTime = (campaign.timeDelayTrigger.days * 24 * 60 * 60 * 1000) + 
                             (campaign.timeDelayTrigger.hours * 60 * 60 * 1000) +
                             (campaign.timeDelayTrigger.minutes * 60 * 1000);

          const minutesSince = Math.round(timeSinceManualEmail / 1000 / 60);
          const minutesTrigger = Math.round(triggerTime / 1000 / 60);
          const minutesRemaining = Math.round((triggerTime - timeSinceManualEmail) / 1000 / 60);
          const secondsSince = Math.round(timeSinceManualEmail / 1000);

          console.log(`⏱️ ${recipient.email}: ${minutesSince}m ${secondsSince % 60}s since manual email (${recipient.manualEmailSentAt.toLocaleTimeString()}), trigger at ${minutesTrigger}m`);
          
          if (timeSinceManualEmail >= triggerTime) {
            emailsToSend.push(recipient.email);
            console.log(`✅ ${recipient.email} will receive time delay email (${minutesSince}m ${secondsSince % 60}s >= ${minutesTrigger}m)`);
          } else {
            console.log(`⏳ ${recipient.email} - not ready yet (${minutesRemaining}m ${Math.round((triggerTime - timeSinceManualEmail) / 1000) % 60}s remaining, ${minutesSince}m ${secondsSince % 60}s/${minutesTrigger}m)`);
          }
        }

        if (emailsToSend.length > 0 && campaign.timeDelayTrigger.followUpEmail) {
          console.log(`📧 Sending ${emailsToSend.length} time delay emails for campaign: ${campaign.name}`);
          
          for (const email of emailsToSend) {
            await this.sendSingleEmail(campaign, email, campaign.timeDelayTrigger.followUpEmail);
            
            // Mark time delay email as sent for this recipient
            const recipient = campaign.recipients.find(r => r.email === email);
            if (recipient) {
              recipient.timeDelayEmailSent = true;
            }
          }

          // Update analytics and save campaign
          campaign.analytics.totalSent += emailsToSend.length;
          await campaign.save();
          
          console.log(`✅ Sent ${emailsToSend.length} time delay emails for campaign: ${campaign.name}`);
        } else if (emailsToSend.length > 0) {
          console.log(`⚠️ No follow-up email configured for campaign: ${campaign.name}`);
        } else {
          console.log(`📧 No emails to send for campaign: ${campaign.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking time triggers:', error);
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
        manualEmailSentAt: null, // Will be set when manual email is sent
        timeDelayEmailSent: false, // Will be set to true when time delay email is sent
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
    console.log('⏰ Starting time delay trigger checking every 30 seconds...');
    
    // Check immediately on startup
    this.checkTimeTriggers();
    
    // Check every 30 seconds for more precise timing
    const intervalId = setInterval(() => {
      console.log('⏰ Scheduled time delay trigger check running...');
      this.checkTimeTriggers();
    }, 30 * 1000); // 30 seconds
    
    // Store the interval ID so we can clear it if needed
    this.timeTriggerInterval = intervalId;
    
    console.log('✅ Time delay trigger checking started successfully');
    
    // Test that it's working
    setTimeout(() => {
      console.log('🧪 Testing time delay trigger checking (30 seconds after startup)...');
      this.checkTimeTriggers();
    }, 30 * 1000); // Test after 30 seconds
  }

  // Check if time trigger checking is running
  isTimeTriggerCheckingRunning() {
    return !!this.timeTriggerInterval;
  }

  // Test behavior trigger manually (for debugging)
  async testBehaviorTrigger(campaignId, userEmail, behavior) {
    console.log(`🧪 Testing behavior trigger: ${behavior} for ${userEmail} in campaign ${campaignId}`);
    
    const result = await this.handleUserBehavior(campaignId, userEmail, behavior);
    
    if (result.success) {
      console.log(`✅ Behavior test successful: ${result.message}`);
      if (result.followUpSent) {
        console.log(`📧 Follow-up email was sent for ${behavior} behavior`);
      } else {
        console.log(`ℹ️ No follow-up email configured for ${behavior} behavior`);
      }
    } else {
      console.log(`❌ Behavior test failed: ${result.message}`);
    }
    
    return result;
  }
}

module.exports = new EmailCampaignEngine(); 