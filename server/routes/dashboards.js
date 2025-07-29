const express = require('express');
const Dashboard = require('../models/Dashboard');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper function to ensure dashboard has complete theme structure
const ensureCompleteTheme = (dashboard) => {
  const defaultTheme = {
    name: 'Default Theme',
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      border: '#e0e0e0'
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      unit: 8,
      borderRadius: 4
    },
    shadows: {
      enabled: true,
      intensity: 1
    }
  };

  // If dashboard has no theme or incomplete theme, merge with default
  if (!dashboard.theme) {
    dashboard.theme = defaultTheme;
  } else {
    // Merge existing theme with default to ensure all properties exist
    dashboard.theme = {
      ...defaultTheme,
      ...dashboard.theme,
      colors: {
        ...defaultTheme.colors,
        ...dashboard.theme.colors
      },
      typography: {
        ...defaultTheme.typography,
        ...dashboard.theme.typography
      },
      spacing: {
        ...defaultTheme.spacing,
        ...dashboard.theme.spacing
      },
      shadows: {
        ...defaultTheme.shadows,
        ...dashboard.theme.shadows
      }
    };
  }

  return dashboard;
};

// Get all dashboards for current user
router.get('/', auth, async (req, res) => {
  try {
    // Get ALL dashboards (public to all users)
    const dashboards = await Dashboard.find({
      isActive: true
    }).populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .sort({ updatedAt: -1 });

    // Ensure all dashboards have complete theme structure
    const dashboardsWithCompleteTheme = dashboards.map(dashboard => {
      const dashboardObj = dashboard.toObject();
      return ensureCompleteTheme(dashboardObj);
    });

    res.json({ dashboards: dashboardsWithCompleteTheme });
  } catch (error) {
    console.error('Fetch dashboards error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards.' });
  }
});

// Get single dashboard by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Allow access to ANY dashboard (public)
    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found.' });
    }

    // Ensure dashboard has complete theme structure
    const dashboardObj = dashboard.toObject();
    const dashboardWithCompleteTheme = ensureCompleteTheme(dashboardObj);

    res.json({ dashboard: dashboardWithCompleteTheme });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
});

// Create new dashboard
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, layout, theme, settings } = req.body;

    const dashboard = new Dashboard({
      name,
      description,
      owner: req.user._id,
      layout,
      theme,
      settings
    });

    await dashboard.save();

    const populatedDashboard = await Dashboard.findById(dashboard._id)
      .populate('owner', 'username email');

    // Ensure the created dashboard has complete theme structure
    const dashboardObj = populatedDashboard.toObject();
    const dashboardWithCompleteTheme = ensureCompleteTheme(dashboardObj);

    res.status(201).json({
      message: 'Dashboard created successfully',
      dashboard: dashboardWithCompleteTheme
    });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: 'Failed to create dashboard.' });
  }
});

// Update dashboard
router.put('/:id', auth, async (req, res) => {
  try {
    // Allow ANY user to edit ANY dashboard (public collaborative system)
    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found.' });
    }

    const { name, description, layout, widgets, theme, settings } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (layout) updates.layout = layout;
    if (widgets) updates.widgets = widgets;
    if (theme) updates.theme = theme;
    if (settings) updates.settings = settings;

    // Use findByIdAndUpdate to avoid version conflicts
    const updatedDashboard = await Dashboard.findByIdAndUpdate(
      dashboard._id,
      updates,
      { 
        new: true, 
        runValidators: true
      }
    )
    .populate('owner', 'username email')
    .populate('collaborators.user', 'username email');

    console.log(`Dashboard ${dashboard._id} updated by user ${req.user.username}`);

    // Ensure the updated dashboard has complete theme structure
    const dashboardObj = updatedDashboard.toObject();
    const dashboardWithCompleteTheme = ensureCompleteTheme(dashboardObj);

    res.json({
      message: 'Dashboard updated successfully',
      dashboard: dashboardWithCompleteTheme
    });
  } catch (error) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ error: 'Failed to update dashboard.' });
  }
});

// Delete dashboard
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only the owner can delete the dashboard
    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      owner: req.user._id, // Only owner can delete
      isActive: true
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found or you do not have permission to delete it.' });
    }

    dashboard.isActive = false;
    await dashboard.save();

    res.json({ message: 'Dashboard deleted successfully.' });
  } catch (error) {
    console.error('Delete dashboard error:', error);
    res.status(500).json({ error: 'Failed to delete dashboard.' });
  }
});

// Add collaborator to dashboard
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { userId, role, permissions } = req.body;

    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'admin' }
      ],
      isActive: true
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found or access denied.' });
    }

    // Check if user is already a collaborator
    const existingCollaborator = dashboard.collaborators.find(
      c => c.user.toString() === userId
    );

    if (existingCollaborator) {
      return res.status(400).json({ error: 'User is already a collaborator.' });
    }

    dashboard.collaborators.push({
      user: userId,
      role: role || 'viewer',
      permissions: permissions || ['read']
    });

    await dashboard.save();

    const updatedDashboard = await Dashboard.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    res.json({
      message: 'Collaborator added successfully',
      dashboard: updatedDashboard
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ error: 'Failed to add collaborator.' });
  }
});

// Remove collaborator from dashboard
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'admin' }
      ],
      isActive: true
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found or access denied.' });
    }

    dashboard.collaborators = dashboard.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );

    await dashboard.save();

    const updatedDashboard = await Dashboard.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    res.json({
      message: 'Collaborator removed successfully',
      dashboard: updatedDashboard
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Failed to remove collaborator.' });
  }
});

module.exports = router; 