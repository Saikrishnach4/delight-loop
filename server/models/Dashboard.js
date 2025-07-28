const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['chart', 'table', 'metric', 'text', 'image', 'button', 'form', 'email-campaign']
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 6 },
    h: { type: Number, default: 4 }
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dataSource: {
    type: String,
    default: null
  },
  style: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isVisible: {
    type: Boolean,
    default: true
  }
});

const dashboardSchema = new mongoose.Schema({
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
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'share']
    }]
  }],
  layout: {
    type: String,
    enum: ['grid', 'flexible', 'fixed'],
    default: 'grid'
  },
  widgets: [widgetSchema],
  theme: {
    primary: { type: String, default: '#1976d2' },
    secondary: { type: String, default: '#dc004e' },
    background: { type: String, default: '#ffffff' },
    text: { type: String, default: '#000000' }
  },
  settings: {
    isPublic: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
    refreshInterval: { type: Number, default: 30000 } // 30 seconds
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
dashboardSchema.index({ owner: 1, isActive: 1 });
dashboardSchema.index({ 'collaborators.user': 1, isActive: 1 });

module.exports = mongoose.model('Dashboard', dashboardSchema); 