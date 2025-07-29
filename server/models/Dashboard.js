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
    // Basic theme properties
    primary: { type: String, default: '#1976d2' },
    secondary: { type: String, default: '#dc004e' },
    background: { type: String, default: '#ffffff' },
    text: { type: String, default: '#000000' },
    border: { type: String, default: '#e0e0e0' },
    
    // Extended theme structure
    colors: {
      primary: { type: String, default: '#1976d2' },
      secondary: { type: String, default: '#dc004e' },
      background: { type: String, default: '#ffffff' },
      surface: { type: String, default: '#f5f5f5' },
      text: { type: String, default: '#000000' },
      border: { type: String, default: '#e0e0e0' }
    },
    
    typography: {
      fontFamily: { type: String, default: 'Roboto, sans-serif' },
      fontSize: { type: Number, default: 14 },
      fontWeight: { type: Number, default: 400 },
      lineHeight: { type: Number, default: 1.5 }
    },
    
    spacing: {
      unit: { type: Number, default: 8 },
      borderRadius: { type: Number, default: 4 }
    },
    
    shadows: {
      enabled: { type: Boolean, default: true },
      intensity: { type: Number, default: 1 }
    },
    
    // Theme metadata
    name: { type: String, default: 'Default Theme' }
  },
  settings: {
    isPublic: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
    refreshInterval: { type: Number, default: 30000 } // 30 seconds
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  // Disable versioning to prevent conflicts in collaborative editing
  versionKey: false
});

// Index for better query performance
dashboardSchema.index({ owner: 1, isActive: 1 });
dashboardSchema.index({ 'collaborators.user': 1, isActive: 1 });

module.exports = mongoose.model('Dashboard', dashboardSchema); 