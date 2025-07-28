const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get active users in a dashboard
router.get('/dashboard/:dashboardId/users', auth, async (req, res) => {
  try {
    // This would typically fetch from a real-time store (Redis, etc.)
    // For now, we'll return a mock response
    const activeUsers = [
      {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        lastSeen: new Date(),
        isOnline: true
      }
    ];

    res.json({ activeUsers });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: 'Failed to get active users.' });
  }
});

// Get collaboration history
router.get('/dashboard/:dashboardId/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // This would typically fetch from a collaboration history collection
    const history = [
      {
        id: '1',
        type: 'widget_added',
        user: {
          id: req.user._id,
          username: req.user.username
        },
        details: {
          widgetType: 'chart',
          widgetId: 'widget-1'
        },
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'dashboard_updated',
        user: {
          id: req.user._id,
          username: req.user.username
        },
        details: {
          field: 'name',
          oldValue: 'Old Dashboard',
          newValue: 'New Dashboard'
        },
        timestamp: new Date(Date.now() - 60000)
      }
    ];

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length
      }
    });
  } catch (error) {
    console.error('Get collaboration history error:', error);
    res.status(500).json({ error: 'Failed to get collaboration history.' });
  }
});

// Get user permissions for dashboard
router.get('/dashboard/:dashboardId/permissions', auth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    
    // This would typically check against the dashboard's collaborator list
    const permissions = {
      canEdit: true,
      canDelete: false,
      canShare: true,
      canAddCollaborators: false,
      role: 'editor'
    };

    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions.' });
  }
});

module.exports = router; 