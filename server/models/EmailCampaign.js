const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'paused'],
    default: 'draft'
  },
  emailTemplate: {
    subject: String,
    body: String,
    senderName: String
  },
  // Time delay trigger - send email after X time
  timeDelayTrigger: {
    enabled: { type: Boolean, default: false },
    days: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
    followUpEmail: {
      subject: String,
      body: String
    }
  },
  // User behavior triggers
  behaviorTriggers: [{
    behavior: {
      type: String,
      enum: ['open', 'click', 'idle'],
      required: true
    },
    enabled: { type: Boolean, default: true },
    idleTime: {
      enabled: { type: Boolean, default: false },
      minutes: { type: Number, default: 30 }
    },
    followUpEmail: {
      subject: String,
      body: String
    }
  }],
  recipients: [{
    email: String,
    name: String,
    lastActivity: Date,
    manualEmails: [{
      sentAt: Date,
      timeDelayEmailSent: { type: Boolean, default: false },
      idleEmailSent: { type: Boolean, default: false },
      hasLinks: { type: Boolean, default: false }, // Track if email contains clickable links
      openFollowUpSent: { type: Boolean, default: false }, // Track if open follow-up was sent
      clickFollowUpSent: { type: Boolean, default: false } // Track if click follow-up was sent
    }],
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active'
    }
  }],
  analytics: {
    totalSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

emailCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema); 