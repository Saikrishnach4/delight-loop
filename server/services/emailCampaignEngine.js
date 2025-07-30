const EmailCampaign = require('../models/EmailCampaign');
const emailService = require('./emailService');
const queueManager = require('./queueManager');

class EmailCampaignEngine {
  constructor() {
    this.timeTriggerInterval = null;
  }

  // Send manual email to all active recipients
  async sendManualEmail(campaignId) {
    try {
      console.log(`📧 Starting manual email send for campaign ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const activeRecipients = campaign.recipients.filter(r => r.status === 'active');
      console.log(`📧 Found ${activeRecipients.length} active recipients`);

      if (activeRecipients.length === 0) {
        throw new Error('No active recipients found');
      }

      let sentCount = 0;
      
      for (const recipient of activeRecipients) {
        try {
          console.log(`📧 Sending manual email to ${recipient.email}`);
          
          await this.sendSingleEmail(campaign, recipient.email, campaign.emailTemplate);
          
          // Update recipient's last activity
          recipient.lastActivity = new Date();
          
          // Add new manual email entry
          if (!recipient.manualEmails) {
            recipient.manualEmails = [];
          }
          
          // Check if email template contains links
          const emailContent = campaign.emailTemplate.body || '';
          const hasLinks = emailContent.includes('<a href=') || emailContent.includes('http://') || emailContent.includes('https://');
          
          recipient.manualEmails.push({
            sentAt: new Date(),
            hasLinks: hasLinks,
            timeDelayEmailSent: false,
            idleEmailSent: false,
            openFollowUpSent: false,
            clickFollowUpSent: false,
            opened: false,
            clicked: false,
            purchasePageVisited: false
          });
          
          sentCount++;
          console.log(`✅ Manual email sent to ${recipient.email}`);
          
        } catch (error) {
          console.error(`❌ Failed to send manual email to ${recipient.email}:`, error);
        }
      }

      // Save campaign with updated recipients
      await campaign.save();
      
      // Schedule triggers for each sent email
      for (const recipient of activeRecipients) {
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          const manualEmailIndex = recipient.manualEmails.length - 1;
          try {
            await this.scheduleTriggersForManualEmail(campaignId, recipient.email, manualEmailIndex);
          } catch (error) {
            console.error(`❌ Failed to schedule triggers for ${recipient.email}:`, error);
          }
        }
      }
      
      console.log(`✅ Manual email sent to ${sentCount} recipients for campaign: ${campaign.name}`);
      return { success: true, sentCount };
      
    } catch (error) {
      console.error('❌ Error sending manual email:', error);
      throw error;
    }
  }

  // Send single email to a recipient
  async sendSingleEmail(campaign, recipientEmail, emailTemplate) {
    try {
      console.log(`📧 Sending single email to ${recipientEmail}`);
      
      // Extract email template body
      const emailBody = emailTemplate.body || emailTemplate.html || emailTemplate.content || '';
      console.log(`📧 Email template body length: ${emailBody.length}`);
      
      // Add tracking to email
      const emailWithTracking = await emailService.addTrackingToEmail(
        emailBody,
        campaign._id.toString(),
        recipientEmail,
        null, // baseUrl
        campaign
      );
      
      // Send email
      await emailService.sendEmail({
        to: recipientEmail,
        subject: emailTemplate.subject || 'Email from Delight Loop',
        body: emailWithTracking
      });
      
      // Update campaign analytics for follow-up emails
      campaign.analytics.totalSent = (campaign.analytics.totalSent || 0) + 1;
      
      console.log(`✅ Single email sent to ${recipientEmail}`);
      
    } catch (error) {
      console.error(`❌ Error sending single email to ${recipientEmail}:`, error);
      throw error;
    }
  }

  // Handle user behavior (open, click, purchase, etc.)
  async handleUserBehavior(campaignId, userEmail, behavior, additionalData = {}) {
    try {
      console.log(`📊 Handling user behavior: ${behavior} for ${userEmail} in campaign ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const recipient = campaign.recipients.find(r => r.email === userEmail);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      if (recipient.manualEmails && recipient.manualEmails.length > 0) {
        const latestEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
        
        if (behavior === 'open') {
          latestEmail.opened = true;
          console.log(`📧 Marked latest email as opened for ${userEmail}`);
          
          // Update campaign analytics
          campaign.analytics.totalOpens = (campaign.analytics.totalOpens || 0) + 1;
        } else if (behavior === 'click') {
          latestEmail.clicked = true;
          console.log(`📧 Marked latest email as clicked for ${userEmail}`);
          
          // Update campaign analytics
          campaign.analytics.totalClicks = (campaign.analytics.totalClicks || 0) + 1;
        } else if (behavior === 'purchase') {
          latestEmail.purchased = true;
          latestEmail.purchasedAt = new Date();
          latestEmail.purchaseAmount = additionalData.purchaseAmount || 99.99;
          latestEmail.purchaseCurrency = additionalData.purchaseCurrency || 'USD';
          console.log(`📧 Marked latest email as purchased for ${userEmail}`);
          
          // Update campaign analytics
          campaign.analytics.totalPurchases = (campaign.analytics.totalPurchases || 0) + 1;
          campaign.analytics.totalRevenue = (campaign.analytics.totalRevenue || 0) + (additionalData.purchaseAmount || 99.99);
        } else if (behavior === 'purchasePageVisit') {
          latestEmail.purchasePageVisited = true;
          latestEmail.purchasePageVisitedAt = new Date();
          console.log(`📧 Marked latest email as purchase page visited for ${userEmail}`);
        }
      }

      // Check for behavior triggers
      const triggerResult = await this.checkBehaviorTriggers(campaign, userEmail, behavior);
      
      await campaign.save();
      
      return {
        success: true,
        message: `Behavior ${behavior} recorded for ${userEmail}`,
        followUpSent: triggerResult.followUpSent
      };
      
    } catch (error) {
      console.error(`❌ Error handling user behavior for ${userEmail}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Check for behavior triggers
  async checkBehaviorTriggers(campaign, userEmail, behavior) {
    try {
      console.log(`🔍 Checking behavior triggers for ${behavior} from ${userEmail}`);
      console.log(`📋 Campaign behavior triggers:`, campaign.behaviorTriggers);
      
      const behaviorTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === behavior && t.enabled && t.followUpEmail
      );
      
      console.log(`🔍 Filtered triggers for ${behavior}:`, behaviorTriggers);
      
      if (behaviorTriggers.length === 0) {
        console.log(`⏭️ No enabled ${behavior} triggers found`);
        console.log(`📋 Available behaviors:`, campaign.behaviorTriggers.map(t => ({ behavior: t.behavior, enabled: t.enabled, hasFollowUp: !!t.followUpEmail })));
        return { followUpSent: false };
      }
      
      const trigger = behaviorTriggers[0]; // Use first matching trigger
      console.log(`✅ Found ${behavior} trigger with follow-up email:`, trigger);
      
      // Send follow-up email
      await this.sendSingleEmail(campaign, userEmail, {
        subject: trigger.followUpEmail.subject,
        body: trigger.followUpEmail.body,
        senderName: campaign.emailTemplate?.senderName || 'Delight Loop'
      });
      
      // Mark follow-up as sent
      const recipient = campaign.recipients.find(r => r.email === userEmail);
      if (recipient && recipient.manualEmails && recipient.manualEmails.length > 0) {
        const latestEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
        if (behavior === 'open') {
          latestEmail.openFollowUpSent = true;
        } else if (behavior === 'click') {
          latestEmail.clickFollowUpSent = true;
        }
      }
      
      console.log(`✅ ${behavior} follow-up email sent to ${userEmail}`);
      return { followUpSent: true };
      
    } catch (error) {
      console.error(`❌ Error checking behavior triggers for ${behavior}:`, error);
      return { followUpSent: false };
    }
  }

  // OLD TRIGGER CHECKING METHODS REMOVED - NOW USING REDIS/BULLMQ QUEUES
  // Time delay and idle triggers are now scheduled individually when emails are sent
  // and processed by dedicated workers in workerService.js

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
        manualEmails: [],
        status: 'active'
      });

      await campaign.save();
      return campaign;
    } catch (error) {
      console.error('❌ Error adding recipient:', error);
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
      console.log(`📊 Getting analytics for campaign: ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      console.log(`📊 Campaign found: ${campaign.name}`);
      console.log(`📊 Campaign analytics:`, campaign.analytics);
      console.log(`📊 Total recipients: ${campaign.recipients.length}`);

      const analytics = {
        campaign: {
          _id: campaign._id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          timeDelayTrigger: campaign.timeDelayTrigger,
          behaviorTriggers: campaign.behaviorTriggers
        },
        totalSent: campaign.analytics.totalSent || 0,
        totalOpens: campaign.analytics.totalOpens || 0,
        totalClicks: campaign.analytics.totalClicks || 0,
        totalPurchases: campaign.analytics.totalPurchases || 0,
        totalRevenue: campaign.analytics.totalRevenue || 0,
        timeDelayTriggersScheduled: campaign.analytics.timeDelayTriggersScheduled || 0,
        idleTriggersScheduled: campaign.analytics.idleTriggersScheduled || 0,
        timeDelayEmailsSent: campaign.analytics.timeDelayEmailsSent || 0,
        idleEmailsSent: campaign.analytics.idleEmailsSent || 0,
        // Calculate rates
        openRate: campaign.analytics.totalSent > 0 ? ((campaign.analytics.totalOpens || 0) / campaign.analytics.totalSent * 100).toFixed(1) : '0.0',
        clickRate: campaign.analytics.totalSent > 0 ? ((campaign.analytics.totalClicks || 0) / campaign.analytics.totalSent * 100).toFixed(1) : '0.0',
        recipients: campaign.recipients.map(recipient => {
          console.log(`📊 Processing recipient: ${recipient.email}`);
          console.log(`📊 Manual emails:`, recipient.manualEmails);
          
          // Calculate recipient-specific analytics
          const totalFollowUps = recipient.manualEmails ? recipient.manualEmails.filter(me => me.timeDelayEmailSent).length : 0;
          const totalIdleEmails = recipient.manualEmails ? recipient.manualEmails.filter(me => me.idleEmailSent).length : 0;
          const totalOpenFollowUps = recipient.manualEmails ? recipient.manualEmails.filter(me => me.openFollowUpSent).length : 0;
          const totalClickFollowUps = recipient.manualEmails ? recipient.manualEmails.filter(me => me.clickFollowUpSent).length : 0;
          
          // Track actual opens and clicks
          const totalOpens = recipient.manualEmails ? recipient.manualEmails.filter(me => me.opened).length : 0;
          const totalClicks = recipient.manualEmails ? recipient.manualEmails.filter(me => me.clicked).length : 0;
          const totalPurchases = recipient.manualEmails ? recipient.manualEmails.filter(me => me.purchased).length : 0;
          const totalBehaviorEmails = totalOpens + totalClicks;
          
          console.log(`📊 ${recipient.email} - Opens: ${totalOpens}, Clicks: ${totalClicks}, Follow-ups: ${totalFollowUps}`);
          
          return {
            email: recipient.email,
            name: recipient.name,
            status: recipient.status,
            lastActivity: recipient.lastActivity,
            // Email counts
            manualEmailsCount: recipient.manualEmails ? recipient.manualEmails.length : 0,
            followUpsSent: totalFollowUps,
            idleEmailsSent: totalIdleEmails,
            emailsWithLinks: recipient.manualEmails ? recipient.manualEmails.filter(me => me.hasLinks).length : 0,
            // Behavior tracking
            totalOpens: totalOpens,
            totalClicks: totalClicks,
            totalPurchases: totalPurchases,
            totalBehaviorEmails: totalBehaviorEmails,
            // Rates
            openRate: recipient.manualEmails && recipient.manualEmails.length > 0 ? (totalOpens / recipient.manualEmails.length * 100).toFixed(1) : 0,
            clickRate: recipient.manualEmails && recipient.manualEmails.length > 0 ? (totalClicks / recipient.manualEmails.length * 100).toFixed(1) : 0,
            // Detailed email history
            manualEmails: recipient.manualEmails ? recipient.manualEmails.map(me => ({
              sentAt: me.sentAt,
              timeDelayEmailSent: me.timeDelayEmailSent,
              idleEmailSent: me.idleEmailSent,
              hasLinks: me.hasLinks,
              openFollowUpSent: me.openFollowUpSent || false,
              clickFollowUpSent: me.clickFollowUpSent || false,
              opened: me.opened || false,
              clicked: me.clicked || false,
              purchased: me.purchased || false,
              purchasedAt: me.purchasedAt,
              purchaseAmount: me.purchaseAmount,
              purchaseCurrency: me.purchaseCurrency,
              purchasePageVisited: me.purchasePageVisited || false,
              purchasePageVisitedAt: me.purchasePageVisitedAt
            })) : []
          };
        })
      };

      console.log(`📊 Analytics calculated for campaign: ${campaign.name}`);
      return analytics;
      
    } catch (error) {
      console.error('❌ Error getting campaign analytics:', error);
      throw error;
    }
  }

  // Start time trigger checking (now just a placeholder for BullMQ system)
  startTimeTriggerChecking() {
    console.log('⏰ BullMQ queue-based trigger system is active');
    console.log('✅ Time delay and idle time triggers are now handled by Redis queues');
    console.log('📋 No more setInterval/setTimeout - all triggers are scheduled individually');
    
    // Mark that the system is running
    this.timeTriggerInterval = 'bullmq-active';
    
    console.log('✅ BullMQ-based trigger system started successfully');
  }

  // Check if time trigger checking is running
  isTimeTriggerCheckingRunning() {
    return this.timeTriggerInterval === 'bullmq-active';
  }

  // Schedule triggers when manual email is sent
  async scheduleTriggersForManualEmail(campaignId, recipientEmail, manualEmailIndex) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const recipient = campaign.recipients.find(r => r.email === recipientEmail);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      let manualEmail = recipient.manualEmails[manualEmailIndex];
      let actualEmailIndex = manualEmailIndex;
      
      if (!manualEmail) {
        console.log(`⚠️ Manual email not found for ${recipientEmail} at index ${manualEmailIndex}. Available emails: ${recipient.manualEmails.length}`);
        console.log(`🔍 Available manual emails:`, recipient.manualEmails.map((me, i) => ({ index: i, sentAt: me.sentAt })));
        // Try to use the last email instead
        if (recipient.manualEmails.length > 0) {
          actualEmailIndex = recipient.manualEmails.length - 1;
          console.log(`🔄 Using last email index ${actualEmailIndex} instead of ${manualEmailIndex}`);
          manualEmail = recipient.manualEmails[actualEmailIndex];
          if (manualEmail) {
            console.log(`✅ Found last email at index ${actualEmailIndex}, proceeding with trigger scheduling`);
          } else {
            console.log(`❌ Last email not found either, skipping trigger scheduling`);
            return;
          }
        } else {
          console.log(`❌ No manual emails found, skipping trigger scheduling`);
          return;
        }
      }

      // Schedule time delay trigger if enabled
      console.log(`🔍 Checking time delay trigger for ${recipientEmail}:`);
      console.log(`   - Campaign timeDelayTrigger:`, JSON.stringify(campaign.timeDelayTrigger, null, 2));
      console.log(`   - Enabled: ${campaign.timeDelayTrigger?.enabled}`);
      console.log(`   - Has follow-up email: ${!!campaign.timeDelayTrigger?.followUpEmail}`);
      console.log(`   - Follow-up email subject: ${campaign.timeDelayTrigger?.followUpEmail?.subject}`);
      console.log(`   - Follow-up email body length: ${campaign.timeDelayTrigger?.followUpEmail?.body?.length || 0}`);
      
      if (campaign.timeDelayTrigger?.enabled && campaign.timeDelayTrigger?.followUpEmail) {
        const days = campaign.timeDelayTrigger.days || 0;
        const hours = campaign.timeDelayTrigger.hours || 0;
        const minutes = campaign.timeDelayTrigger.minutes || 0;
        
        const triggerTime = (days * 24 * 60 * 60 * 1000) + 
                           (hours * 60 * 60 * 1000) +
                           (minutes * 60 * 1000);
        
        console.log(`⏰ Time delay trigger configuration:`);
        console.log(`   - Days: ${days}`);
        console.log(`   - Hours: ${hours}`);
        console.log(`   - Minutes: ${minutes}`);
        console.log(`   - Total trigger time: ${triggerTime}ms (${triggerTime / 1000 / 60} minutes)`);
        console.log(`   - Will execute at: ${new Date(Date.now() + triggerTime).toISOString()}`);
        
        await queueManager.scheduleTimeDelayTrigger(
          campaignId,
          recipientEmail,
          actualEmailIndex,
          triggerTime
        );
        
        console.log(`✅ Time delay trigger scheduled for ${recipientEmail} (manual email ${actualEmailIndex + 1})`);
        
        // Update analytics
        campaign.analytics.timeDelayTriggersScheduled = (campaign.analytics.timeDelayTriggersScheduled || 0) + 1;
        await campaign.save();
        console.log(`📊 Time delay trigger analytics updated for ${recipientEmail}`);
      } else {
        console.log(`⏭️ Time delay trigger not scheduled for ${recipientEmail}:`);
        console.log(`   - Enabled: ${campaign.timeDelayTrigger?.enabled}`);
        console.log(`   - Has follow-up email: ${!!campaign.timeDelayTrigger?.followUpEmail}`);
      }

      // Schedule idle time trigger if enabled and email contains links
      const idleTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
      );
      
      // Check if this is a purchase campaign email
      const isPurchaseCampaign = campaign.purchaseCampaignType && campaign.purchaseCampaignType !== 'none';
      
      if (idleTriggers.length > 0 && (manualEmail.hasLinks || isPurchaseCampaign)) {
        const idleTrigger = idleTriggers[0];
        const idleTimeMs = idleTrigger.idleTime.minutes * 60 * 1000;
        
        await queueManager.scheduleIdleTimeTrigger(
          campaignId,
          recipientEmail,
          actualEmailIndex,
          idleTimeMs
        );
        
        console.log(`✅ Idle trigger scheduled for ${recipientEmail} (manual email ${actualEmailIndex + 1}) in ${idleTimeMs}ms`);
        console.log(`🔍 Idle trigger scheduled because: hasLinks=${manualEmail.hasLinks}, isPurchaseCampaign=${isPurchaseCampaign}`);
        
        // Update analytics
        campaign.analytics.idleTriggersScheduled = (campaign.analytics.idleTriggersScheduled || 0) + 1;
        await campaign.save();
        console.log(`📊 Idle trigger analytics updated for ${recipientEmail}`);
      } else if (idleTriggers.length > 0) {
        console.log(`⏭️ Idle trigger not scheduled for ${recipientEmail}: hasLinks=${manualEmail.hasLinks}, isPurchaseCampaign=${isPurchaseCampaign}`);
      }
      
    } catch (error) {
      console.error(`❌ Error scheduling triggers for ${recipientEmail}:`, error);
      throw error;
    }
  }

  // Test behavior trigger manually (for debugging)
  async testBehaviorTrigger(campaignId, userEmail, behavior) {
    console.log(`🧪 Testing behavior trigger: ${behavior} for ${userEmail} in campaign ${campaignId}`);
    
    const workerService = require('./workerService');
    const result = await workerService.handleUserBehavior(campaignId, userEmail, behavior);
    
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

  // Send manual email to specific recipients only
  async sendManualEmailToRecipients(campaignId, recipientEmails) {
    try {
      console.log(`📧 Starting manual email send to specific recipients for campaign ${campaignId}`);
      console.log(`📧 Recipients: ${recipientEmails.join(', ')}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      let sentCount = 0;
      
      for (const email of recipientEmails) {
        const recipient = campaign.recipients.find(r => r.email === email && r.status === 'active');
        if (!recipient) {
          console.log(`⚠️ Recipient ${email} not found or not active`);
          continue;
        }

        try {
          console.log(`📧 Sending manual email to ${email}`);
          
          await this.sendSingleEmail(campaign, email, campaign.emailTemplate);
          
          // Update recipient's last activity
          recipient.lastActivity = new Date();
          
          // Add new manual email entry
          if (!recipient.manualEmails) {
            recipient.manualEmails = [];
          }
          
          // Check if email template contains links
          const emailContent = campaign.emailTemplate.body || '';
          const hasLinks = emailContent.includes('<a href=') || emailContent.includes('http://') || emailContent.includes('https://');
          
          recipient.manualEmails.push({
            sentAt: new Date(),
            hasLinks: hasLinks,
            timeDelayEmailSent: false,
            idleEmailSent: false,
            openFollowUpSent: false,
            clickFollowUpSent: false,
            opened: false,
            clicked: false,
            purchasePageVisited: false
          });
          
          sentCount++;
          console.log(`✅ Manual email sent to ${email}`);
          
          // Update campaign analytics
          campaign.analytics.totalSent = (campaign.analytics.totalSent || 0) + 1;
          
        } catch (error) {
          console.error(`❌ Failed to send manual email to ${email}:`, error);
        }
      }

      // Save campaign with updated recipients
      await campaign.save();
      
      // Schedule triggers for each sent email
      for (const email of recipientEmails) {
        const recipient = campaign.recipients.find(r => r.email === email);
        if (recipient && recipient.manualEmails && recipient.manualEmails.length > 0) {
          const manualEmailIndex = recipient.manualEmails.length - 1;
          try {
            await this.scheduleTriggersForManualEmail(campaignId, email, manualEmailIndex);
          } catch (error) {
            console.error(`❌ Failed to schedule triggers for ${email}:`, error);
          }
        }
      }
      
      console.log(`✅ Manual email sent to ${sentCount} recipients for campaign: ${campaign.name}`);
      return { success: true, sentCount };
      
    } catch (error) {
      console.error('❌ Error sending manual email to specific recipients:', error);
      throw error;
    }
  }
}

module.exports = new EmailCampaignEngine(); 