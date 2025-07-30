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
      console.log(`🔍 Campaign ID: ${campaignId}, Recipient: ${recipientEmail}, Email Index: ${manualEmailIndex}`);
      console.log(`🕐 Time delay trigger processing started at: ${new Date().toISOString()}`);
      
      // Validate campaignId format
      if (!campaignId || campaignId === 'test-campaign-id') {
        console.log(`⏭️ Skipping test campaign: ${campaignId}`);
        return;
      }
      
      // Validate ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        console.error(`❌ Invalid campaign ID format: ${campaignId}`);
        throw new Error(`Invalid campaign ID format: ${campaignId}`);
      }
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      if (campaign.status !== 'active') {
        throw new Error(`Campaign ${campaignId} is not active (status: ${campaign.status})`);
      }

      const recipient = campaign.recipients.find(r => r.email === recipientEmail);
      if (!recipient) {
        throw new Error(`Recipient ${recipientEmail} not found in campaign ${campaignId}`);
      }
      if (recipient.status !== 'active') {
        throw new Error(`Recipient ${recipientEmail} is not active (status: ${recipient.status})`);
      }

      const manualEmail = recipient.manualEmails[manualEmailIndex];
      if (!manualEmail) {
        throw new Error(`Manual email at index ${manualEmailIndex} not found for ${recipientEmail}`);
      }

      if (manualEmail.timeDelayEmailSent) {
        console.log(`⏭️ Time delay email already sent for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Check if time delay trigger is properly configured
      if (!campaign.timeDelayTrigger?.enabled) {
        throw new Error('Time delay trigger is not enabled');
      }
      if (!campaign.timeDelayTrigger?.followUpEmail) {
        throw new Error('Time delay trigger follow-up email is not configured');
      }

      console.log(`📧 Sending time delay follow-up email to ${recipientEmail}`);
      console.log(`📧 Subject: ${campaign.timeDelayTrigger.followUpEmail.subject}`);
      console.log(`📧 Follow-up email body length: ${campaign.timeDelayTrigger.followUpEmail.body?.length || 0} characters`);
      
      // Send time delay follow-up email
      await this.sendSingleEmail(campaign, recipientEmail, {
        subject: campaign.timeDelayTrigger.followUpEmail.subject,
        body: campaign.timeDelayTrigger.followUpEmail.body,
        senderName: campaign.emailTemplate?.senderName || 'Delight Loop'
      });
      
      // Mark time delay email as sent
      manualEmail.timeDelayEmailSent = true;
      manualEmail.hasLinks = true; // Enable idle tracking for follow-up email
      
      // Update analytics
      campaign.analytics.totalSent += 1;
      campaign.analytics.timeDelayEmailsSent = (campaign.analytics.timeDelayEmailsSent || 0) + 1;
      await campaign.save();
      
      console.log(`✅ Time delay follow-up email sent to ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      console.log(`📊 Time delay email analytics updated for ${recipientEmail}`);
      
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
      } else {
        console.log(`⏭️ No idle triggers configured for campaign ${campaign.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing time delay trigger for ${recipientEmail}:`, error);
      console.error(`❌ Error details:`, error.stack);
      throw error;
    }
  }

  // Process idle time trigger for a specific recipient
  async processIdleTimeTrigger(campaignId, recipientEmail, manualEmailIndex) {
    try {
      console.log(`⏰ Processing idle time trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      console.log(`🔍 Campaign ID: ${campaignId}, Recipient: ${recipientEmail}, Email Index: ${manualEmailIndex}`);
      
      // Validate campaignId format
      if (!campaignId || campaignId === 'test-campaign-id') {
        console.log(`⏭️ Skipping test campaign: ${campaignId}`);
        return;
      }
      
      // Validate ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        console.error(`❌ Invalid campaign ID format: ${campaignId}`);
        throw new Error(`Invalid campaign ID format: ${campaignId}`);
      }
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      if (campaign.status !== 'active') {
        throw new Error(`Campaign ${campaignId} is not active (status: ${campaign.status})`);
      }

      const recipient = campaign.recipients.find(r => r.email === recipientEmail);
      if (!recipient) {
        throw new Error(`Recipient ${recipientEmail} not found in campaign ${campaignId}`);
      }
      if (recipient.status !== 'active') {
        throw new Error(`Recipient ${recipientEmail} is not active (status: ${recipient.status})`);
      }

      const manualEmail = recipient.manualEmails[manualEmailIndex];
      if (!manualEmail) {
        throw new Error(`Manual email at index ${manualEmailIndex} not found for ${recipientEmail}`);
      }

      // Check if idle email already sent
      if (manualEmail.idleEmailSent) {
        console.log(`⏭️ Idle email already sent for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
        return;
      }

      // Check if user has already interacted
      // For purchase campaigns, check if they opened the email (pixel tracking) or clicked the purchase button
      const isPurchaseCampaign = campaign.purchaseCampaignType && campaign.purchaseCampaignType !== 'none';
      
      if (isPurchaseCampaign) {
        // For purchase campaigns, check if user visited the purchase page (pixel tracking only)
        if (manualEmail.purchasePageVisited) {
          console.log(`⏭️ User already visited purchase page for ${recipientEmail} (purchase page visited: ${manualEmail.purchasePageVisited})`);
          return;
        }
      } else {
               // For regular campaigns, check if user clicked the email
       if (manualEmail.clickFollowUpSent) {
          console.log(`⏭️ User already interacted for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
          return;
        }
      }

      // For purchase campaigns, always allow idle trigger if user hasn't visited the purchase page
      if (isPurchaseCampaign) {
        console.log(`🔍 Purchase campaign idle trigger check for ${recipientEmail}:`);
        console.log(`  - User visited purchase page (pixel tracking): ${manualEmail.purchasePageVisited}`);
        console.log(`  - Idle trigger should fire: ${!manualEmail.purchasePageVisited}`);
        
        // For purchase campaigns, idle trigger should fire if user hasn't visited the purchase page
        if (manualEmail.purchasePageVisited) {
          console.log(`⏭️ User already visited purchase page for ${recipientEmail}`);
          return;
        }
      } else {
        // For regular campaigns, check if any email contains links
        const originalEmailHasLinks = manualEmail.hasLinks;
        const timeDelayEmailSent = manualEmail.timeDelayEmailSent;
        const timeDelayFollowUpHasLinks = campaign.timeDelayTrigger?.enabled && 
                                         campaign.timeDelayTrigger?.followUpEmail?.body && 
                                         (campaign.timeDelayTrigger.followUpEmail.body.includes('<a href=') || 
                                          campaign.timeDelayTrigger.followUpEmail.body.includes('http://') || 
                                          campaign.timeDelayTrigger.followUpEmail.body.includes('https://'));
        
        const anyEmailHasLinks = originalEmailHasLinks || (timeDelayEmailSent && timeDelayFollowUpHasLinks);
        
        console.log(`🔍 Regular campaign idle trigger check for ${recipientEmail}:`);
        console.log(`  - Original email has links: ${originalEmailHasLinks}`);
        console.log(`  - Time delay email sent: ${timeDelayEmailSent}`);
        console.log(`  - Time delay follow-up has links: ${timeDelayFollowUpHasLinks}`);
        console.log(`  - Any email has links: ${anyEmailHasLinks}`);
        
        if (!anyEmailHasLinks) {
          console.log(`⏭️ No emails contain links for ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
          return;
        }
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
      console.log(`📧 Sending idle reminder email to ${recipientEmail}`);
      console.log(`📧 Subject: ${idleTrigger.followUpEmail.subject}`);
      
      // Send idle reminder email
      await this.sendSingleEmail(campaign, recipientEmail, {
        subject: idleTrigger.followUpEmail.subject,
        body: idleTrigger.followUpEmail.body,
        senderName: campaign.emailTemplate?.senderName || 'Delight Loop'
      });
      
      // Mark idle email as sent
      manualEmail.idleEmailSent = true;
      
      // Update analytics
      campaign.analytics.totalSent += 1;
      campaign.analytics.idleEmailsSent = (campaign.analytics.idleEmailsSent || 0) + 1;
      await campaign.save();
      
      console.log(`✅ Idle reminder email sent to ${recipientEmail} (manual email ${manualEmailIndex + 1})`);
      console.log(`📊 Idle email analytics updated for ${recipientEmail}`);
      
    } catch (error) {
      console.error(`❌ Error processing idle time trigger for ${recipientEmail}:`, error);
      console.error(`❌ Error details:`, error.stack);
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

  // Handle user behavior (click) - simplified version for workers
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

      // Mark the behavior as occurred (only if not already marked)
      if (behavior === 'click') {
        if (!latestManualEmail.clicked) {
          latestManualEmail.clicked = true;
          latestManualEmail.clickedAt = new Date();
          campaign.analytics.totalClicks += 1;
          console.log(`📧 First time marking email as clicked for ${userEmail}`);
        } else {
          console.log(`⏭️ Email already marked as clicked for ${userEmail}, skipping duplicate`);
        }
      } else if (behavior === 'purchase') {
        if (!latestManualEmail.purchased) {
          latestManualEmail.purchased = true;
          latestManualEmail.purchasedAt = new Date();
          // Note: Purchase amount and currency are handled in the main emailCampaignEngine
          // This worker version doesn't have access to additional data
          campaign.analytics.totalPurchases += 1;
          campaign.analytics.totalRevenue += (latestManualEmail.purchaseAmount || 0);
          console.log(`📧 First time marking email as purchased for ${userEmail}`);
        } else {
          console.log(`⏭️ Email already marked as purchased for ${userEmail}, skipping duplicate`);
        }
      } else if (behavior === 'purchasePageVisit') {
        if (!latestManualEmail.purchasePageVisited) {
          latestManualEmail.purchasePageVisited = true;
          latestManualEmail.purchasePageVisitedAt = new Date();
          console.log(`📧 First time marking email as purchase page visited for ${userEmail}`);
        } else {
          console.log(`⏭️ Email already marked as purchase page visited for ${userEmail}, skipping duplicate`);
        }
      }

      // Check for behavior triggers
      const behaviorTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === behavior && t.enabled && t.followUpEmail
      );

      if (behaviorTriggers.length > 0) {
        const trigger = behaviorTriggers[0];
        
        // Check if follow-up already sent
        if ((behavior === 'click' && latestManualEmail.clickFollowUpSent) ||
            (behavior === 'purchase' && latestManualEmail.purchaseFollowUpSent)) {
          console.log(`⏭️ ${behavior} follow-up already sent for ${userEmail}`);
          await campaign.save();
          return { success: true, message: `${behavior} follow-up already sent`, followUpSent: false };
        }

        // Send follow-up email
        await this.sendSingleEmail(campaign, userEmail, {
          subject: trigger.followUpEmail.subject,
          body: trigger.followUpEmail.body,
          senderName: campaign.emailTemplate?.senderName || 'Delight Loop'
        });
        
        // Mark follow-up as sent
        if (behavior === 'click') {
          latestManualEmail.clickFollowUpSent = true;
        } else if (behavior === 'purchase') {
          latestManualEmail.purchaseFollowUpSent = true;
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