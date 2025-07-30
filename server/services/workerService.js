const EmailCampaign = require('../models/EmailCampaign');
const emailService = require('./emailService');

class WorkerService {
  constructor() {
    // Initialize any worker-specific configurations
  }

  // Process time delay trigger for a specific recipient
  async processTimeDelayTrigger(campaignId, recipientEmail, manualEmailIndex) {
    try {
      console.log(`⏰ Processing time delay trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const recipient = campaign.recipients.find(r => r.email === recipientEmail);
      if (!recipient || recipient.status !== 'active') {
        throw new Error('Recipient not found or not active');
      }

      const manualEmail = recipient.manualEmails[manualEmailIndex];
      if (!manualEmail) {
        throw new Error('Manual email not found');
      }

      if (manualEmail.timeDelayEmailSent) {
        console.log(`⏭️ Time delay email already sent for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Send time delay follow-up email
      await this.sendSingleEmail(campaign, recipientEmail, campaign.timeDelayTrigger.followUpEmail);
      
      // Mark time delay email as sent
      manualEmail.timeDelayEmailSent = true;
      manualEmail.hasLinks = true; // Enable idle tracking for follow-up email
      
      // Update analytics
      campaign.analytics.totalSent += 1;
      await campaign.save();
      
      console.log(`✅ Time delay follow-up email sent to ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      
      // Schedule idle time trigger if campaign has idle triggers
      const idleTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
      );
      
      if (idleTriggers.length > 0) {
        const idleTrigger = idleTriggers[0]; // Use first idle trigger
        const idleTimeMs = idleTrigger.idleTime.minutes * 60 * 1000;
        
        // Import queueManager dynamically to avoid circular dependency
        const queueManager = require('./queueManager');
        await queueManager.scheduleIdleTimeTrigger(
          campaignId, 
          recipientEmail, 
          manualEmailIndex, 
          idleTimeMs
        );
        
        console.log(`⏰ Scheduled idle time trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1}) in ${idleTrigger.idleTime.minutes} minutes`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing time delay trigger for ${recipientEmail}:`, error);
      throw error;
    }
  }

  // Process idle time trigger for a specific recipient
  async processIdleTimeTrigger(campaignId, recipientEmail, manualEmailIndex) {
    try {
      console.log(`⏰ Processing idle time trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const recipient = campaign.recipients.find(r => r.email === recipientEmail);
      if (!recipient || recipient.status !== 'active') {
        throw new Error('Recipient not found or not active');
      }

      const manualEmail = recipient.manualEmails[manualEmailIndex];
      if (!manualEmail) {
        throw new Error('Manual email not found');
      }

      // Check if idle email already sent
      if (manualEmail.idleEmailSent) {
        console.log(`⏭️ Idle email already sent for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Check if user has already interacted
      if (manualEmail.openFollowUpSent || manualEmail.clickFollowUpSent) {
        console.log(`⏭️ User already interacted for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Check if any email contains links (original or time delay follow-up)
      const originalEmailHasLinks = manualEmail.hasLinks;
      const timeDelayEmailSent = manualEmail.timeDelayEmailSent;
      const timeDelayFollowUpHasLinks = campaign.timeDelayTrigger?.enabled && 
                                       campaign.timeDelayTrigger?.followUpEmail?.body && 
                                       (campaign.timeDelayTrigger.followUpEmail.body.includes('<a href=') || 
                                        campaign.timeDelayTrigger.followUpEmail.body.includes('http://') || 
                                        campaign.timeDelayTrigger.followUpEmail.body.includes('https://'));
      
      const anyEmailHasLinks = originalEmailHasLinks || (timeDelayEmailSent && timeDelayFollowUpHasLinks);
      
      if (!anyEmailHasLinks) {
        console.log(`⏭️ No emails contain links for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Find idle trigger
      const idleTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
      );
      
      if (idleTriggers.length === 0) {
        console.log(`⏭️ No idle triggers configured for campaign ${campaign.name}`);
        return;
      }

      const idleTrigger = idleTriggers[0];
      
      // Send idle reminder email
      await this.sendSingleEmail(campaign, recipientEmail, idleTrigger.followUpEmail);
      
      // Mark idle email as sent
      manualEmail.idleEmailSent = true;
      
      // Update analytics
      campaign.analytics.totalSent += 1;
      await campaign.save();
      
      console.log(`✅ Idle reminder email sent to ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      
    } catch (error) {
      console.error(`❌ Error processing idle time trigger for ${recipientEmail}:`, error);
      throw error;
    }
  }

  // Send a single email with tracking
  async sendSingleEmail(campaign, recipientEmail, emailTemplate) {
    try {
      console.log(`📧 Sending email to ${recipientEmail} for campaign: ${campaign.name}`);
      
      // Add tracking to email content
      const trackedEmailContent = emailService.addTrackingToEmail(
        emailTemplate.body,
        campaign._id.toString(),
        recipientEmail
      );
      
      const emailData = {
        to: recipientEmail,
        subject: emailTemplate.subject,
        body: trackedEmailContent
      };
      
      const result = await emailService.sendEmail(emailData);
      console.log(`✅ Email sent successfully to ${recipientEmail}:`, result.messageId);
      
      return result;
    } catch (error) {
      console.error(`❌ Error sending email to ${recipientEmail}:`, error);
      throw error;
    }
  }

  // Handle user behavior (open, click) - simplified version for workers
  async handleUserBehavior(campaignId, userEmail, behavior) {
    try {
      console.log(`🎯 Handling user behavior: ${behavior} for ${userEmail} in campaign ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const recipient = campaign.recipients.find(r => r.email === userEmail);
      if (!recipient || recipient.status !== 'active') {
        throw new Error('Recipient not found or not active');
      }

      // Find the most recent manual email
      if (!recipient.manualEmails || recipient.manualEmails.length === 0) {
        throw new Error('No manual emails found for recipient');
      }

      const latestManualEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
      const manualEmailIndex = recipient.manualEmails.length - 1;

      // Update recipient's last activity
      recipient.lastActivity = new Date();

      // Mark the behavior as occurred
      if (behavior === 'open') {
        latestManualEmail.opened = true;
        campaign.analytics.totalOpens += 1;
      } else if (behavior === 'click') {
        latestManualEmail.clicked = true;
        campaign.analytics.totalClicks += 1;
      }

      // Check for behavior triggers
      const behaviorTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === behavior && t.enabled && t.followUpEmail
      );

      if (behaviorTriggers.length > 0) {
        const trigger = behaviorTriggers[0];
        
        // Check if follow-up already sent
        if ((behavior === 'open' && latestManualEmail.openFollowUpSent) ||
            (behavior === 'click' && latestManualEmail.clickFollowUpSent)) {
          console.log(`⏭️ ${behavior} follow-up already sent for ${userEmail}`);
          await campaign.save();
          return { success: true, message: `${behavior} follow-up already sent`, followUpSent: false };
        }

        // Send follow-up email
        await this.sendSingleEmail(campaign, userEmail, trigger.followUpEmail);
        
        // Mark follow-up as sent
        if (behavior === 'open') {
          latestManualEmail.openFollowUpSent = true;
        } else if (behavior === 'click') {
          latestManualEmail.clickFollowUpSent = true;
        }

        campaign.analytics.totalSent += 1;
        console.log(`✅ ${behavior} follow-up email sent to ${userEmail}`);
      }

      await campaign.save();
      
      return { 
        success: true, 
        message: `${behavior} behavior processed successfully`, 
        followUpSent: behaviorTriggers.length > 0 
      };
      
    } catch (error) {
      console.error(`❌ Error handling user behavior for ${userEmail}:`, error);
      throw error;
    }
  }
}

module.exports = new WorkerService(); 