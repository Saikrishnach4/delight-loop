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
      console.log(`📧 Starting manual email send for campaign ${campaignId}`);
      
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      const activeRecipients = campaign.recipients.filter(r => r.status === 'active');
      console.log(`📧 Found ${activeRecipients.length} active recipients`);
      
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
            timeDelayEmailSent: false,
            idleEmailSent: false,
            hasLinks: hasLinks,
            openFollowUpSent: false,
            clickFollowUpSent: false
          });
          
          console.log(`📧 Added manual email entry for ${recipient.email} at ${recipient.manualEmails[recipient.manualEmails.length - 1].sentAt.toLocaleTimeString()}`);
          if (hasLinks) {
            console.log(`📧 Email contains links - will be eligible for idle tracking`);
          }
          
          sentCount++;
          console.log(`✅ Manual email sent successfully to ${recipient.email}`);
          
        } catch (error) {
          console.error(`❌ Failed to send manual email to ${recipient.email}:`, error);
          // Continue with other recipients even if one fails
        }
      }

      // Update analytics
      campaign.analytics.totalSent += sentCount;
      await campaign.save();

      console.log(`📧 Manual email send completed. Sent to ${sentCount} recipients`);
      return { sent: sentCount };
    } catch (error) {
      console.error('❌ Error sending manual email:', error);
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
        console.log(`📧 Found behavior trigger for ${behavior}, checking if follow-up already sent...`);
        
        // Check if we already sent a follow-up for this behavior
        // We'll track this by adding a flag to the most recent manual email
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          const latestManualEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
          
          // Check if we already sent a follow-up for this behavior
          const behaviorKey = `${behavior}FollowUpSent`;
          if (latestManualEmail[behaviorKey]) {
            console.log(`⏭️ Skipping ${behavior} follow-up for ${userEmail} - already sent for this manual email`);
          } else {
            console.log(`📧 Sending ${behavior} follow-up email to ${userEmail}`);
            
            // Send the follow-up email
            await this.sendSingleEmail(campaign, userEmail, behaviorTrigger.followUpEmail);
            
            // Mark that we sent the follow-up for this behavior
            latestManualEmail[behaviorKey] = true;
            
            // Update analytics
            campaign.analytics.totalSent += 1;
            
            console.log(`✅ Sent ${behavior} follow-up email to ${userEmail}`);
          }
        } else {
          console.log(`⚠️ No manual emails found for ${userEmail}, cannot send behavior follow-up`);
        }
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
          
          if (recipient.status !== 'active') {
            console.log(`⏭️ Skipping ${recipient.email} - not active`);
            continue;
          }
          
          if (!recipient.manualEmails || recipient.manualEmails.length === 0) {
            console.log(`⏭️ Skipping ${recipient.email} - no manual emails sent yet`);
            continue;
          }
          
          // Check each manual email for follow-up
          for (let i = 0; i < recipient.manualEmails.length; i++) {
            const manualEmail = recipient.manualEmails[i];
            
            if (manualEmail.timeDelayEmailSent) {
              console.log(`⏭️ Skipping manual email ${i + 1} for ${recipient.email} - follow-up already sent`);
              continue;
            }
            
            const timeSinceManualEmail = Date.now() - manualEmail.sentAt.getTime();
            const triggerTime = (campaign.timeDelayTrigger.days * 24 * 60 * 60 * 1000) + 
                               (campaign.timeDelayTrigger.hours * 60 * 60 * 1000) +
                               (campaign.timeDelayTrigger.minutes * 60 * 1000);

            const minutesSince = Math.round(timeSinceManualEmail / 1000 / 60);
            const minutesTrigger = Math.round(triggerTime / 1000 / 60);
            const minutesRemaining = Math.round((triggerTime - timeSinceManualEmail) / 1000 / 60);
            const secondsSince = Math.round(timeSinceManualEmail / 1000);

            console.log(`⏱️ ${recipient.email} (manual email ${i + 1}): ${minutesSince}m ${secondsSince % 60}s since manual email (${manualEmail.sentAt.toLocaleTimeString()}), trigger at ${minutesTrigger}m`);
            
            if (timeSinceManualEmail >= triggerTime) {
              emailsToSend.push({
                email: recipient.email,
                manualEmailIndex: i
              });
              console.log(`✅ ${recipient.email} (manual email ${i + 1}) will receive time delay email (${minutesSince}m ${secondsSince % 60}s >= ${minutesTrigger}m)`);
            } else {
              console.log(`⏳ ${recipient.email} (manual email ${i + 1}) - not ready yet (${minutesRemaining}m ${Math.round((triggerTime - timeSinceManualEmail) / 1000) % 60}s remaining, ${minutesSince}m ${secondsSince % 60}s/${minutesTrigger}m)`);
            }
          }
        }

        if (emailsToSend.length > 0 && campaign.timeDelayTrigger.followUpEmail) {
          console.log(`📧 Sending ${emailsToSend.length} time delay emails for campaign: ${campaign.name}`);
          console.log(`📧 Recipients to receive follow-up: ${emailsToSend.map(e => `${e.email} (manual email ${e.manualEmailIndex + 1})`).join(', ')}`);
          
          for (const emailData of emailsToSend) {
            try {
              console.log(`📧 Sending follow-up email to: ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
              await this.sendSingleEmail(campaign, emailData.email, campaign.timeDelayTrigger.followUpEmail);
              
              // Mark time delay email as sent for this specific manual email
              const recipient = campaign.recipients.find(r => r.email === emailData.email);
              if (recipient && recipient.manualEmails[emailData.manualEmailIndex]) {
                recipient.manualEmails[emailData.manualEmailIndex].timeDelayEmailSent = true;
                // Mark follow-up email as having links for idle tracking
                recipient.manualEmails[emailData.manualEmailIndex].hasLinks = true;
                console.log(`✅ Time delay email sent and marked for ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
              } else {
                console.error(`❌ Recipient or manual email not found for ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
              }
            } catch (error) {
              console.error(`❌ Failed to send time delay email to ${emailData.email} (manual email ${emailData.manualEmailIndex + 1}):`, error);
              // Continue with other recipients even if one fails
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

  // Check for idle time triggers
  async checkIdleTimeTriggers() {
    try {
      console.log('⏰ Checking idle time triggers...', new Date().toLocaleTimeString());
      
      const allCampaigns = await EmailCampaign.find({});
      console.log(`📧 Total campaigns in database: ${allCampaigns.length}`);
      
      const activeCampaigns = await EmailCampaign.find({ 
        status: 'active'
      });
      
      console.log(`📧 Found ${activeCampaigns.length} active campaigns`);
      
      if (activeCampaigns.length === 0) {
        console.log('⚠️ No active campaigns found');
        return;
      }

      for (const campaign of activeCampaigns) {
        console.log(`📧 Checking campaign: ${campaign.name}`);
        
        // Find idle behavior triggers
        const idleTriggers = campaign.behaviorTriggers.filter(t => 
          t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
        );
        
        if (idleTriggers.length === 0) {
          console.log(`📧 No enabled idle triggers found for campaign: ${campaign.name}`);
          continue;
        }

        console.log(`📧 Found ${idleTriggers.length} idle triggers for campaign: ${campaign.name}`);
        
        for (const idleTrigger of idleTriggers) {
          console.log(`📧 Checking idle trigger with ${idleTrigger.idleTime.minutes} minutes timeout`);
          
          const emailsToSend = [];
          
          for (const recipient of campaign.recipients) {
            if (recipient.status !== 'active') {
              continue;
            }
            
            // Check each manual email for idle time
            if (recipient.manualEmails && recipient.manualEmails.length > 0) {
              for (let i = 0; i < recipient.manualEmails.length; i++) {
                const manualEmail = recipient.manualEmails[i];
                
                // Skip if idle email already sent for this manual email
                if (manualEmail.idleEmailSent) {
                  console.log(`⏭️ Skipping ${recipient.email} (manual email ${i + 1}) - idle email already sent`);
                  continue;
                }
                
                // Check if user has already interacted with this email (opened or clicked)
                // If they have, don't send idle email
                if (manualEmail.openFollowUpSent || manualEmail.clickFollowUpSent) {
                  console.log(`⏭️ Skipping ${recipient.email} (manual email ${i + 1}) - user already interacted (opened: ${manualEmail.openFollowUpSent}, clicked: ${manualEmail.clickFollowUpSent})`);
                  continue;
                }
                
                // Only send idle email if the email contains links OR if time delay email was already sent
                // This ensures idle email comes after emails with links or follow-up emails
                if (!manualEmail.hasLinks && !manualEmail.timeDelayEmailSent) {
                  console.log(`⏭️ Skipping ${recipient.email} (manual email ${i + 1}) - no links and no time delay email sent yet`);
                  continue;
                }
                
                // If it's a time delay email, wait for it to be sent first
                if (manualEmail.timeDelayEmailSent === false && campaign.timeDelayTrigger?.enabled) {
                  console.log(`⏭️ Skipping ${recipient.email} (manual email ${i + 1}) - waiting for time delay email to be sent first`);
                  continue;
                }
                
                const timeSinceManualEmail = Date.now() - manualEmail.sentAt.getTime();
                const idleTimeMs = idleTrigger.idleTime.minutes * 60 * 1000;
                
                const minutesSince = Math.round(timeSinceManualEmail / 1000 / 60);
                const minutesIdle = Math.round(idleTimeMs / 1000 / 60);
                
                console.log(`⏱️ ${recipient.email} (manual email ${i + 1}): ${minutesSince}m since manual email, idle timeout: ${minutesIdle}m`);
                
                if (timeSinceManualEmail >= idleTimeMs) {
                  emailsToSend.push({
                    email: recipient.email,
                    manualEmailIndex: i
                  });
                  console.log(`✅ ${recipient.email} (manual email ${i + 1}) will receive idle reminder email (${minutesSince}m >= ${minutesIdle}m)`);
                }
              }
            }
          }

          if (emailsToSend.length > 0 && idleTrigger.followUpEmail) {
            console.log(`📧 Sending ${emailsToSend.length} idle reminder emails for campaign: ${campaign.name}`);
            
            for (const emailData of emailsToSend) {
              try {
                console.log(`📧 Sending idle reminder email to: ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
                await this.sendSingleEmail(campaign, emailData.email, idleTrigger.followUpEmail);
                
                // Mark idle email as sent for this specific manual email
                const recipient = campaign.recipients.find(r => r.email === emailData.email);
                if (recipient && recipient.manualEmails[emailData.manualEmailIndex]) {
                  recipient.manualEmails[emailData.manualEmailIndex].idleEmailSent = true;
                  console.log(`✅ Idle reminder email sent and marked for ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
                }
              } catch (error) {
                console.error(`❌ Failed to send idle reminder email to ${emailData.email}:`, error);
              }
            }

            // Update analytics and save campaign
            campaign.analytics.totalSent += emailsToSend.length;
            await campaign.save();
            
            console.log(`✅ Sent ${emailsToSend.length} idle reminder emails for campaign: ${campaign.name}`);
          } else if (emailsToSend.length > 0) {
            console.log(`⚠️ No idle reminder email configured for campaign: ${campaign.name}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking idle time triggers:', error);
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
        manualEmails: [], // Initialize empty array for manual emails
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
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

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
        recipients: campaign.recipients.map(recipient => ({
          email: recipient.email,
          name: recipient.name,
          status: recipient.status,
          lastActivity: recipient.lastActivity,
          manualEmailsCount: recipient.manualEmails ? recipient.manualEmails.length : 0,
          followUpsSent: recipient.manualEmails ? recipient.manualEmails.filter(me => me.timeDelayEmailSent).length : 0,
          idleEmailsSent: recipient.manualEmails ? recipient.manualEmails.filter(me => me.idleEmailSent).length : 0,
          emailsWithLinks: recipient.manualEmails ? recipient.manualEmails.filter(me => me.hasLinks).length : 0,
          manualEmails: recipient.manualEmails ? recipient.manualEmails.map(me => ({
            sentAt: me.sentAt,
            timeDelayEmailSent: me.timeDelayEmailSent,
            idleEmailSent: me.idleEmailSent,
            hasLinks: me.hasLinks
          })) : []
        }))
      };

      return analytics;
    } catch (error) {
      console.error('❌ Error getting campaign analytics:', error);
      throw error;
    }
  }

  // Start time-based trigger checking (run this periodically)
  startTimeTriggerChecking() {
    console.log('⏰ Starting time delay trigger checking every 30 seconds...');
    
    // Check immediately on startup
    this.checkTimeTriggers();
    this.checkIdleTimeTriggers();
    
    // Check every 30 seconds for more precise timing
    const intervalId = setInterval(() => {
      console.log('⏰ Scheduled time delay trigger check running...');
      this.checkTimeTriggers();
      this.checkIdleTimeTriggers();
    }, 30 * 1000); // 30 seconds
    
    // Store the interval ID so we can clear it if needed
    this.timeTriggerInterval = intervalId;
    
    console.log('✅ Time delay trigger checking started successfully');
    
    // Test that it's working
    setTimeout(() => {
      console.log('🧪 Testing time delay trigger checking (30 seconds after startup)...');
      this.checkTimeTriggers();
      this.checkIdleTimeTriggers();
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
            timeDelayEmailSent: false,
            idleEmailSent: false,
            hasLinks: hasLinks,
            openFollowUpSent: false,
            clickFollowUpSent: false
          });
          
          console.log(`📧 Added manual email entry for ${email} at ${recipient.manualEmails[recipient.manualEmails.length - 1].sentAt.toLocaleTimeString()}`);
          if (hasLinks) {
            console.log(`📧 Email contains links - will be eligible for idle tracking`);
          }
          
          sentCount++;
          console.log(`✅ Manual email sent successfully to ${email}`);
          
        } catch (error) {
          console.error(`❌ Failed to send manual email to ${email}:`, error);
          // Continue with other recipients even if one fails
        }
      }

      // Update analytics and save campaign immediately after all recipients are processed
      campaign.analytics.totalSent += sentCount;
      await campaign.save();
      console.log(`💾 Campaign saved with updated recipient data`);

      console.log(`📧 Manual email send completed. Sent to ${sentCount} recipients`);
      return { sent: sentCount };
    } catch (error) {
      console.error('❌ Error sending manual email to specific recipients:', error);
      throw error;
    }
  }
}

module.exports = new EmailCampaignEngine(); 