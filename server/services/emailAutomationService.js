const EmailCampaign = require('../models/EmailCampaign');
const emailService = require('./emailService');

class EmailAutomationService {
  constructor() {
    this.activeCampaigns = new Map();
    this.scheduledJobs = new Map();
  }

  // Start automation for a campaign
  async startCampaignAutomation(campaignId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Campaign not found or not active');
      }

      // Store campaign in memory for quick access
      this.activeCampaigns.set(campaignId, campaign);

      // Process all subscribers
      for (const subscriber of campaign.subscribers) {
        if (subscriber.status === 'active') {
          await this.processSubscriber(campaign, subscriber);
        }
      }

      console.log(`Started automation for campaign: ${campaign.name}`);
      return { success: true, message: 'Campaign automation started' };
    } catch (error) {
      console.error('Start campaign automation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process individual subscriber through the campaign flow
  async processSubscriber(campaign, subscriber) {
    try {
      const currentStep = campaign.steps.find(step => step.stepNumber === subscriber.currentStep);
      if (!currentStep) {
        console.log(`No more steps for subscriber ${subscriber.email}`);
        return;
      }

      // Check if step should be triggered
      const shouldTrigger = await this.evaluateTriggers(currentStep, subscriber);
      
      if (shouldTrigger) {
        // Send email
        const result = await emailService.sendCampaignEmail(campaign, subscriber, currentStep);
        
        if (result.success) {
          // Update subscriber history
          subscriber.stepHistory.push({
            stepNumber: currentStep.stepNumber,
            sentAt: new Date(),
            status: 'sent'
          });

          // Move to next step
          subscriber.currentStep += 1;
          
          // Update campaign analytics
          campaign.analytics.totalSent += 1;
          
          // Save changes
          await campaign.save();
          
          console.log(`Sent step ${currentStep.stepNumber} to ${subscriber.email}`);
        }
      } else if (currentStep.triggers.type === 'time-delay') {
        // Schedule for later
        this.scheduleStep(campaign, subscriber, currentStep);
      }
    } catch (error) {
      console.error('Process subscriber error:', error);
    }
  }

  // Evaluate if a step should be triggered based on conditions
  async evaluateTriggers(step, subscriber) {
    const { triggers } = step;
    
    switch (triggers.type) {
      case 'immediate':
        return true;
        
      case 'time-delay':
        return this.evaluateTimeDelay(triggers.timeDelay, subscriber);
        
      case 'behavior':
        return this.evaluateBehaviorTriggers(triggers.conditions, subscriber);
        
      case 'condition':
        return this.evaluateConditionalTriggers(triggers.conditions, subscriber);
        
      default:
        return false;
    }
  }

  // Evaluate time-based delays
  evaluateTimeDelay(timeDelay, subscriber) {
    const lastActivity = subscriber.lastActivity || subscriber.subscribedAt;
    const delayMs = (timeDelay.days * 24 * 60 * 60 * 1000) + 
                   (timeDelay.hours * 60 * 60 * 1000) + 
                   (timeDelay.minutes * 60 * 1000);
    
    return Date.now() >= (lastActivity.getTime() + delayMs);
  }

  // Evaluate behavior-based triggers
  evaluateBehaviorTriggers(conditions, subscriber) {
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      
      switch (field) {
        case 'opens':
          const openCount = subscriber.behavior.opens.length;
          if (!this.evaluateCondition(openCount, operator, value)) {
            return false;
          }
          break;
          
        case 'clicks':
          const clickCount = subscriber.behavior.clicks.length;
          if (!this.evaluateCondition(clickCount, operator, value)) {
            return false;
          }
          break;
          
        case 'purchases':
          const purchaseCount = subscriber.behavior.purchases.length;
          if (!this.evaluateCondition(purchaseCount, operator, value)) {
            return false;
          }
          break;
          
        case 'idle_days':
          const lastActivity = subscriber.lastActivity || subscriber.subscribedAt;
          const idleDays = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          if (!this.evaluateCondition(idleDays, operator, value)) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }

  // Evaluate conditional triggers
  evaluateConditionalTriggers(conditions, subscriber) {
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      
      let fieldValue;
      switch (field) {
        case 'email':
          fieldValue = subscriber.email;
          break;
        case 'firstName':
          fieldValue = subscriber.firstName;
          break;
        case 'lastName':
          fieldValue = subscriber.lastName;
          break;
        default:
          fieldValue = subscriber.customFields[field];
      }
      
      if (!this.evaluateCondition(fieldValue, operator, value)) {
        return false;
      }
    }
    
    return true;
  }

  // Generic condition evaluator
  evaluateCondition(actualValue, operator, expectedValue) {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'greater_than':
        return actualValue > expectedValue;
      case 'less_than':
        return actualValue < expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      default:
        return false;
    }
  }

  // Schedule a step for later execution
  scheduleStep(campaign, subscriber, step) {
    const { timeDelay } = step.triggers;
    const delayMs = (timeDelay.days * 24 * 60 * 60 * 1000) + 
                   (timeDelay.hours * 60 * 60 * 1000) + 
                   (timeDelay.minutes * 60 * 1000);
    
    const jobId = `${campaign._id}-${subscriber.email}-${step.stepNumber}`;
    
    const timeout = setTimeout(async () => {
      await this.processSubscriber(campaign, subscriber);
      this.scheduledJobs.delete(jobId);
    }, delayMs);
    
    this.scheduledJobs.set(jobId, timeout);
  }

  // Handle subscriber behavior events
  async handleSubscriberEvent(campaignId, subscriberEmail, eventType) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      if (!campaign) return;

      const subscriber = campaign.subscribers.find(s => s.email === subscriberEmail);
      if (!subscriber) return;

      // Update behavior
      subscriber.behavior[eventType].push(new Date());
      subscriber.lastActivity = new Date();

      // Process subscriber through automation
      await this.processSubscriber(campaign, subscriber);
      
      await campaign.save();
      
      console.log(`Handled ${eventType} event for ${subscriberEmail}`);
    } catch (error) {
      console.error('Handle subscriber event error:', error);
    }
  }

  // Stop automation for a campaign
  async stopCampaignAutomation(campaignId) {
    try {
      this.activeCampaigns.delete(campaignId);
      
      // Clear scheduled jobs for this campaign
      for (const [jobId, timeout] of this.scheduledJobs.entries()) {
        if (jobId.startsWith(campaignId)) {
          clearTimeout(timeout);
          this.scheduledJobs.delete(jobId);
        }
      }
      
      console.log(`Stopped automation for campaign: ${campaignId}`);
      return { success: true, message: 'Campaign automation stopped' };
    } catch (error) {
      console.error('Stop campaign automation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get automation status
  getAutomationStatus(campaignId) {
    const isActive = this.activeCampaigns.has(campaignId);
    const scheduledJobs = Array.from(this.scheduledJobs.keys())
      .filter(jobId => jobId.startsWith(campaignId))
      .length;
    
    return {
      isActive,
      scheduledJobs,
      activeCampaigns: this.activeCampaigns.size
    };
  }
}

module.exports = new EmailAutomationService();