const mongoose = require('mongoose');

const emailStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  emailTemplate: {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    htmlBody: { type: String, default: '' },
    variables: [{ type: String }] // Dynamic variables like {{user.name}}
  },
  triggers: {
    type: {
      type: String,
      enum: ['immediate', 'time-delay', 'behavior', 'condition'],
      default: 'immediate'
    },
    conditions: [{
      field: { type: String }, // e.g., 'opens', 'clicks', 'purchases'
      operator: { type: String, enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'] },
      value: { type: mongoose.Schema.Types.Mixed }
    }],
    timeDelay: {
      days: { type: Number, default: 0 },
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'pending'],
    default: 'pending'
  },
  behavior: {
    opens: [{ type: Date }],
    clicks: [{ type: Date }],
    purchases: [{ type: Date }],
    lastActivity: { type: Date }
  },
  currentStep: {
    type: Number,
    default: 1
  },
  stepHistory: [{
    stepNumber: { type: Number },
    sentAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    status: { type: String, enum: ['sent', 'opened', 'clicked', 'failed'] }
  }],
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['welcome', 'nurture', 'promotional', 'abandoned-cart', 'custom', 'automated', 'manual', 'scheduled'],
    default: 'custom'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  steps: [emailStepSchema],
  subscribers: [subscriberSchema],
  settings: {
    maxEmailsPerDay: { type: Number, default: 1000 },
    sendTime: {
      hour: { type: Number, default: 9 },
      minute: { type: Number, default: 0 },
      timezone: { type: String, default: 'UTC' }
    },
    allowUnsubscribe: { type: Boolean, default: true },
    trackOpens: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true }
  },
  analytics: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
emailCampaignSchema.index({ owner: 1, status: 1 });
emailCampaignSchema.index({ 'subscribers.email': 1 });
emailCampaignSchema.index({ 'subscribers.status': 1 });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema); 