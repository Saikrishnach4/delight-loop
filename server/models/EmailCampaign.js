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
      enum: ['click', 'idle', 'purchase', 'abandonment'],
      required: true
    },
    enabled: { type: Boolean, default: true },
    idleTime: {
      enabled: { type: Boolean, default: false },
      minutes: { type: Number, default: 30 }
    },
    purchaseThreshold: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 }, // Minimum purchase amount
      currency: { type: String, default: 'USD' }
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
      clickFollowUpSent: { type: Boolean, default: false }, // Track if click follow-up was sent
      purchaseFollowUpSent: { type: Boolean, default: false }, // Track if purchase follow-up was sent
      clicked: { type: Boolean, default: false }, // Track if email was actually clicked
      purchased: { type: Boolean, default: false }, // Track if purchase was made
      clickedAt: Date, // When the email was clicked
      purchasedAt: Date, // When the purchase was made
      purchaseAmount: { type: Number, default: 0 }, // Purchase amount
      purchaseCurrency: { type: String, default: 'USD' }, // Purchase currency
      purchasePageAbandoned: { type: Boolean, default: false }, // Track if user abandoned purchase page
      purchasePageTimeSpent: { type: Number, default: 0 }, // Time spent on purchase page (seconds)
      purchasePageAbandonedAt: Date, // When the user abandoned the page
      purchaseCampaigns: [{ // Track purchase campaigns sent to this recipient
        sentAt: Date,
        campaignType: String,
        purchaseAmount: Number,
        purchaseLinkText: String
      }]
    }],
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active'
    }
  }],
  analytics: {
    totalSent: { type: Number, default: 0 },

    totalClicks: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalAbandonments: { type: Number, default: 0 },
    // Trigger scheduling analytics
    timeDelayTriggersScheduled: { type: Number, default: 0 },
    idleTriggersScheduled: { type: Number, default: 0 },
    timeDelayEmailsSent: { type: Number, default: 0 },
    idleEmailsSent: { type: Number, default: 0 }
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
  },
  
  // Purchase Campaign Settings
  purchaseCampaignType: {
    type: String,
    enum: ['none', 'all', 'selected', 'filtered'],
    default: 'none'
  },
  selectedPurchaseRecipients: [String], // Array of email addresses
  purchaseFilter: {
    type: {
      type: String,
      enum: ['clicks', 'purchases', 'inactive', 'new'],
      default: 'clicks'
    },
    threshold: { type: Number, default: 1 }
  },
  purchaseLinkText: {
    type: String,
    default: '🛒 Purchase Now - $99.99'
  },
  purchaseAmount: {
    type: Number,
    default: 99.99
  }
});

emailCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema); 