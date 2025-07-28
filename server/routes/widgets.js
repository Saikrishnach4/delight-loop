const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get available widget types
router.get('/types', auth, async (req, res) => {
  try {
    const widgetTypes = [
      {
        type: 'chart',
        name: 'Chart',
        description: 'Display data in various chart formats',
        icon: '📊',
        configSchema: {
          chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'doughnut'] },
          dataSource: { type: 'string' },
          title: { type: 'string' },
          colors: { type: 'array' }
        }
      },
      {
        type: 'table',
        name: 'Table',
        description: 'Display data in tabular format',
        icon: '📋',
        configSchema: {
          columns: { type: 'array' },
          dataSource: { type: 'string' },
          pagination: { type: 'boolean' },
          search: { type: 'boolean' }
        }
      },
      {
        type: 'metric',
        name: 'Metric',
        description: 'Display key performance indicators',
        icon: '📈',
        configSchema: {
          value: { type: 'string' },
          label: { type: 'string' },
          format: { type: 'string' },
          trend: { type: 'object' }
        }
      },
      {
        type: 'text',
        name: 'Text',
        description: 'Display formatted text content',
        icon: '📝',
        configSchema: {
          content: { type: 'string' },
          fontSize: { type: 'number' },
          fontWeight: { type: 'string' },
          color: { type: 'string' }
        }
      },
      {
        type: 'image',
        name: 'Image',
        description: 'Display images or graphics',
        icon: '🖼️',
        configSchema: {
          src: { type: 'string' },
          alt: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      {
        type: 'button',
        name: 'Button',
        description: 'Interactive button element',
        icon: '🔘',
        configSchema: {
          text: { type: 'string' },
          action: { type: 'string' },
          style: { type: 'object' },
          onClick: { type: 'string' }
        }
      },
      {
        type: 'form',
        name: 'Form',
        description: 'Data input form',
        icon: '📝',
        configSchema: {
          fields: { type: 'array' },
          submitAction: { type: 'string' },
          validation: { type: 'object' }
        }
      },
      {
        type: 'email-campaign',
        name: 'Email Campaign',
        description: 'Email campaign management widget',
        icon: '📧',
        configSchema: {
          campaignId: { type: 'string' },
          displayMode: { type: 'string', enum: ['overview', 'analytics', 'subscribers'] },
          refreshInterval: { type: 'number' }
        }
      }
    ];

    res.json({ widgetTypes });
  } catch (error) {
    console.error('Get widget types error:', error);
    res.status(500).json({ error: 'Failed to get widget types.' });
  }
});

// Get widget configuration schema
router.get('/:type/schema', auth, async (req, res) => {
  try {
    const { type } = req.params;
    
    // This would typically come from a database or configuration file
    const schemas = {
      chart: {
        chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'doughnut'], default: 'line' },
        dataSource: { type: 'string', required: true },
        title: { type: 'string', default: '' },
        colors: { type: 'array', default: ['#1976d2', '#dc004e', '#388e3c'] },
        showLegend: { type: 'boolean', default: true },
        showGrid: { type: 'boolean', default: true }
      },
      table: {
        columns: { type: 'array', required: true },
        dataSource: { type: 'string', required: true },
        pagination: { type: 'boolean', default: true },
        search: { type: 'boolean', default: true },
        pageSize: { type: 'number', default: 10 }
      },
      metric: {
        value: { type: 'string', required: true },
        label: { type: 'string', default: '' },
        format: { type: 'string', enum: ['number', 'currency', 'percentage'], default: 'number' },
        trend: { type: 'object', default: null },
        color: { type: 'string', default: '#1976d2' }
      },
      'email-campaign': {
        campaignId: { type: 'string', required: true },
        displayMode: { type: 'string', enum: ['overview', 'analytics', 'subscribers'], default: 'overview' },
        refreshInterval: { type: 'number', default: 30000 },
        showCharts: { type: 'boolean', default: true }
      }
    };

    const schema = schemas[type];
    if (!schema) {
      return res.status(404).json({ error: 'Widget type not found.' });
    }

    res.json({ schema });
  } catch (error) {
    console.error('Get widget schema error:', error);
    res.status(500).json({ error: 'Failed to get widget schema.' });
  }
});

// Validate widget configuration
router.post('/:type/validate', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { config } = req.body;

    // Basic validation logic
    const validation = {
      isValid: true,
      errors: []
    };

    // This would contain more sophisticated validation logic
    if (!config) {
      validation.isValid = false;
      validation.errors.push('Configuration is required');
    }

    res.json({ validation });
  } catch (error) {
    console.error('Validate widget error:', error);
    res.status(500).json({ error: 'Failed to validate widget.' });
  }
});

module.exports = router; 