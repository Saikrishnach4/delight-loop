const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');
const emailService = require('./emailService');
const queueManager = require('./queueManager');

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
            clickFollowUpSent: false,
            opened: false,
            clicked: false
          });
          
          console.log(`📧 Added manual email entry for ${recipient.email} at ${recipient.manualEmails[recipient.manualEmails.length - 1].sentAt.toLocaleTimeString()}`);
          if (hasLinks) {
            console.log(`📧 Email contains links - email has passed through Email Template`);
            console.log(`📧 Idle time checking will now be enabled for ${recipient.email} (manual email ${recipient.manualEmails.length})`);
          } else {
            console.log(`📧 Email does not contain links - idle time checking will only be enabled after Time Delay Trigger (if configured)`);
          }
          
          sentCount++;
          console.log(`✅ Manual email sent successfully to ${recipient.email}`);
          
        } catch (error) {
          console.error(`❌ Failed to send manual email to ${recipient.email}:`, error);
          // Continue with other recipients even if one fails
        }
      }

      // Update analytics and save campaign
      campaign.analytics.totalSent += sentCount;
      await campaign.save();

      // Schedule triggers after saving the campaign
      for (const recipient of activeRecipients) {
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          try {
            await this.scheduleTriggersForManualEmail(campaign._id, recipient.email, recipient.manualEmails.length - 1);
          } catch (error) {
            console.error(`❌ Error scheduling triggers for ${recipient.email}:`, error);
            // Don't fail the entire operation for trigger scheduling errors
          }
        }
      }

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
      
      // Update analytics and track actual interactions
      if (behavior === 'open') {
        campaign.analytics.totalOpens += 1;
        console.log(`📊 Updated opens count for campaign ${campaign.name}`);
        
        // Mark the most recent manual email as opened
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          const latestEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
          latestEmail.opened = true;
          latestEmail.openedAt = new Date();
          console.log(`📧 Marked latest email as opened for ${userEmail}`);
        }
      } else if (behavior === 'click') {
        campaign.analytics.totalClicks += 1;
        console.log(`📊 Updated clicks count for campaign ${campaign.name}`);
        
        // Mark the most recent manual email as clicked
        if (recipient.manualEmails && recipient.manualEmails.length > 0) {
          const latestEmail = recipient.manualEmails[recipient.manualEmails.length - 1];
          latestEmail.clicked = true;
          latestEmail.clickedAt = new Date();
          console.log(`📧 Marked latest email as clicked for ${userEmail}`);
        }
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
                console.log(`✅ Time delay email sent and marked for ${emailData.email} (manual email ${emailData.manualEmailIndex + 1}) - email has now passed through Time Delay Trigger`);
                console.log(`📧 Idle time checking will now be enabled for ${emailData.email} (manual email ${emailData.manualEmailIndex + 1})`);
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
  // IMPORTANT: Idle time checking starts when ANY email sent to the user contains links:
  // 1. Original Email Template (contains links) OR
  // 2. Time Delay Follow-up Email (contains links)
  async checkIdleTimeTriggers() {
    try {
      console.log('⏰ Checking idle time triggers...', new Date().toLocaleTimeString());
      console.log('📋 IDLE TIME LOGIC: Checking emails where ANY email sent to the user contains links (original email OR time delay follow-up)');
      
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
                
                // IDLE TIME LOGIC: Start idle checking if ANY email sent to this user contains links
                // This includes: original email template OR time delay follow-up email
                
                // Check if the original email template contains links
                const originalEmailHasLinks = manualEmail.hasLinks;
                
                // Check if time delay follow-up email was sent (which would contain links)
                const timeDelayEmailSent = manualEmail.timeDelayEmailSent;
                
                // Check if campaign has time delay trigger with follow-up email that contains links
                const timeDelayFollowUpHasLinks = campaign.timeDelayTrigger?.enabled && 
                                                 campaign.timeDelayTrigger?.followUpEmail?.body && 
                                                 (campaign.timeDelayTrigger.followUpEmail.body.includes('<a href=') || 
                                                  campaign.timeDelayTrigger.followUpEmail.body.includes('http://') || 
                                                  campaign.timeDelayTrigger.followUpEmail.body.includes('https://'));
                
                // Start idle time if ANY email contains links
                const anyEmailHasLinks = originalEmailHasLinks || (timeDelayEmailSent && timeDelayFollowUpHasLinks);
                
                if (!anyEmailHasLinks) {
                  console.log(`⏭️ Skipping ${recipient.email} (manual email ${i + 1}) - no emails sent to this user contain links`);
                  continue;
                }
                
                // Log which email(s) contain links
                let linkSource = [];
                if (originalEmailHasLinks) linkSource.push('Original Email Template');
                if (timeDelayEmailSent && timeDelayFollowUpHasLinks) linkSource.push('Time Delay Follow-up Email');
                
                console.log(`✅ ${recipient.email} (manual email ${i + 1}) - idle time checking enabled because links found in: ${linkSource.join(' and ')}`);
                
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
      
      console.log('📋 IDLE TIME SUMMARY: Completed checking all campaigns for idle time triggers');
      console.log('📋 Remember: Idle time starts counting when ANY email sent to the user contains links (original email OR time delay follow-up)');
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
        // Calculate rates
        openRate: campaign.analytics.totalSent > 0 ? ((campaign.analytics.totalOpens || 0) / campaign.analytics.totalSent * 100).toFixed(1) : 0,
        clickRate: campaign.analytics.totalSent > 0 ? ((campaign.analytics.totalClicks || 0) / campaign.analytics.totalSent * 100).toFixed(1) : 0,
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
            // Behavior tracking (using follow-up counts as proxy for actual interactions)
            totalOpens: totalOpens,
            totalClicks: totalClicks,
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
              openedAt: me.openedAt,
              clickedAt: me.clickedAt
            })) : []
          };
        })
      };

      console.log(`📊 Final analytics object:`, analytics);
      return analytics;
    } catch (error) {
      console.error('❌ Error getting campaign analytics:', error);
      throw error;
    }
  }

  // Start time-based trigger checking (now handled by BullMQ queues)
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

  // Note: processTimeDelayTrigger and processIdleTimeTrigger methods moved to workerService.js
  // to avoid circular dependency with queueManager

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

      const manualEmail = recipient.manualEmails[manualEmailIndex];
      if (!manualEmail) {
        console.log(`⚠️ Manual email not found for ${recipientEmail} at index ${manualEmailIndex}. Available emails: ${recipient.manualEmails.length}`);
        return; // Exit gracefully instead of throwing error
      }

      // Schedule time delay trigger if enabled
      if (campaign.timeDelayTrigger?.enabled && campaign.timeDelayTrigger?.followUpEmail) {
        const triggerTime = (campaign.timeDelayTrigger.days * 24 * 60 * 60 * 1000) + 
                           (campaign.timeDelayTrigger.hours * 60 * 60 * 1000) +
                           (campaign.timeDelayTrigger.minutes * 60 * 1000);
        
        await queueManager.scheduleTimeDelayTrigger(
          campaignId,
          recipientEmail,
          manualEmailIndex,
          triggerTime
        );
        
        console.log(`⏰ Scheduled time delay trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1}) in ${triggerTime}ms`);
      }

      // Schedule idle time trigger if enabled and email contains links
      const idleTriggers = campaign.behaviorTriggers.filter(t => 
        t.behavior === 'idle' && t.enabled && t.idleTime?.enabled
      );
      
      if (idleTriggers.length > 0 && manualEmail.hasLinks) {
        const idleTrigger = idleTriggers[0];
        const idleTimeMs = idleTrigger.idleTime.minutes * 60 * 1000;
        
        await queueManager.scheduleIdleTimeTrigger(
          campaignId,
          recipientEmail,
          manualEmailIndex,
          idleTimeMs
        );
        
        console.log(`⏰ Scheduled idle time trigger for ${recipientEmail} (manual email ${manualEmailIndex + 1}) in ${idleTimeMs}ms`);
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
            timeDelayEmailSent: false,
            idleEmailSent: false,
            hasLinks: hasLinks,
            openFollowUpSent: false,
            clickFollowUpSent: false,
            opened: false,
            clicked: false
          });
          
          console.log(`📧 Added manual email entry for ${email} at ${recipient.manualEmails[recipient.manualEmails.length - 1].sentAt.toLocaleTimeString()}`);
          if (hasLinks) {
            console.log(`📧 Email contains links - email has passed through Email Template`);
            console.log(`📧 Idle time checking will now be enabled for ${email} (manual email ${recipient.manualEmails.length})`);
          } else {
            console.log(`📧 Email does not contain links - idle time checking will only be enabled after Time Delay Trigger (if configured)`);
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

      // Schedule triggers after saving the campaign
      for (const email of recipientEmails) {
        const recipient = campaign.recipients.find(r => r.email === email && r.status === 'active');
        if (recipient && recipient.manualEmails && recipient.manualEmails.length > 0) {
          try {
            await this.scheduleTriggersForManualEmail(campaign._id, email, recipient.manualEmails.length - 1);
          } catch (error) {
            console.error(`❌ Error scheduling triggers for ${email}:`, error);
            // Don't fail the entire operation for trigger scheduling errors
          }
        }
      }

      console.log(`📧 Manual email send completed. Sent to ${sentCount} recipients`);
      return { sent: sentCount };
    } catch (error) {
      console.error('❌ Error sending manual email to specific recipients:', error);
      throw error;
    }
  }
}

module.exports = new EmailCampaignEngine(); 