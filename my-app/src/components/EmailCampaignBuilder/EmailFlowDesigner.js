import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import toast from 'react-hot-toast';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const EmailFlowDesigner = ({ campaign, flowData, onFlowChange, onSave, onTest }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [nodes, setNodes] = useState(flowData?.nodes || []);
  const [edges, setEdges] = useState(flowData?.edges || []);

  // Sync local state with flowData prop
  useEffect(() => {
    if (flowData) {
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      if (flowData.nodes && flowData.nodes.length > 0) {
        toast.success(`Loaded ${flowData.nodes.length} nodes from saved flow`);
      }
    }
  }, [flowData]);

  const addNode = (type) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: type,
      position: { x: 100 + nodes.length * 200, y: 100 },
      data: {
        label: `New ${type}`,
        type: type,
        config: getDefaultConfig(type),
      },
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    // Update parent component
    onFlowChange({ nodes: newNodes, edges });
    
    // If it's an email node, also update campaign steps
    if (type === 'email') {
      const emailStep = {
        stepNumber: newNodes.length,
        name: `Email Step ${newNodes.length}`,
        emailTemplate: {
          subject: newNode.data.config.subject || 'New Email',
          body: newNode.data.config.content || 'Email content here...',
          htmlBody: newNode.data.config.content || 'Email content here...',
          variables: []
        },
        triggers: {
          type: 'immediate',
          conditions: [],
          timeDelay: { days: 0, hours: 0, minutes: 0 }
        },
        isActive: true
      };
      
      // Update campaign with new step
      if (campaign) {
        const updatedCampaign = {
          ...campaign,
          steps: [...(campaign.steps || []), emailStep]
        };
        // This would need to be handled by the parent component
        console.log('Campaign updated with new email step:', updatedCampaign);
      }
    }
    
    // Show success message
    toast.success(`Added ${type} node to the flow`);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'email':
        return {
          subject: 'New Email',
          content: 'Enter your email content here...',
          template: 'default',
        };
      case 'trigger':
        return {
          triggerType: 'behavior',
          behavior: 'open',
          conditions: [],
        };
      case 'condition':
        return {
          conditionType: 'time',
          value: 7,
          unit: 'days',
        };
      case 'delay':
        return {
          delay: 24,
          unit: 'hours',
        };
      default:
        return {};
    }
  };

  const updateNode = (nodeId, updates) => {
    const newNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
    );
    setNodes(newNodes);
    onFlowChange({ nodes: newNodes, edges });
  };

  const deleteNode = (nodeId) => {
    const newNodes = nodes.filter((node) => node.id !== nodeId);
    setNodes(newNodes);
    onFlowChange({ nodes: newNodes, edges });
  };

  const handleSave = () => {
    const campaignFlow = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.label,
        position: node.position,
        config: node.data.config,
      })),
      edges: edges,
    };
    
    // Convert nodes to campaign steps
    const campaignSteps = nodes.map((node, index) => {
      if (node.data.type === 'email') {
        return {
          stepNumber: index + 1,
          name: node.data.label,
          emailTemplate: {
            subject: node.data.config.subject || 'New Email',
            body: node.data.config.content || 'Email content here...',
            htmlBody: node.data.config.content || 'Email content here...',
            variables: node.data.config.variables || []
          },
          triggers: {
            type: 'immediate',
            conditions: [],
            timeDelay: { days: 0, hours: 0, minutes: 0 }
          },
          isActive: true
        };
      } else {
        return {
          stepNumber: index + 1,
          name: node.data.label,
          type: node.data.type,
          config: node.data.config,
          isActive: true
        };
      }
    });
    
    // Save both flow data and campaign steps
    onSave({
      ...campaignFlow,
      steps: campaignSteps
    });
    toast.success('Campaign flow saved successfully!');
  };

  const handleTest = () => {
    if (nodes.length === 0) {
      toast.error('Please add at least one node to test the campaign');
      return;
    }
    onTest({ nodes, edges });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Email Campaign Flow Designer</Typography>
            <Chip 
              label={`${nodes.length} nodes`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addNode('email')}
            >
              Add Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addNode('trigger')}
            >
              Add Trigger
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addNode('condition')}
            >
              Add Condition
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addNode('delay')}
            >
              Add Delay
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Flow
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayIcon />}
              onClick={handleTest}
            >
              Test Campaign
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Flow Designer Canvas */}
      <Paper sx={{ flex: 1, p: 2, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ minHeight: '400px', position: 'relative' }}>
          {nodes.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <Typography variant="h6" color="text.secondary">
                Click "Add Email" or other buttons above to start building your flow
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', height: '100%' }}>
              {nodes.map((node, index) => (
                <Box
                  key={node.id}
                  sx={{
                    position: 'absolute',
                    left: node.position.x,
                    top: node.position.y,
                    width: 150,
                    height: 80,
                    backgroundColor: 'white',
                    border: '2px solid #1976d2',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => {
                    setSelectedNode(node);
                    setShowNodeConfig(true);
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {node.data.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {node.data.type}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {/* Connection lines */}
              {edges.map((edge, index) => (
                <Box
                  key={edge.id}
                  sx={{
                    position: 'absolute',
                    left: edge.source.x + 75,
                    top: edge.source.y + 40,
                    width: 50,
                    height: 2,
                    backgroundColor: '#1976d2',
                    transform: 'translateY(-50%)',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Node Configuration Dialog */}
      <Dialog
        open={showNodeConfig}
        onClose={() => setShowNodeConfig(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure {selectedNode?.data?.label || 'Node'}
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <NodeConfiguration
              node={selectedNode}
              onUpdate={(updates) => updateNode(selectedNode.id, updates)}
              onDelete={() => {
                deleteNode(selectedNode.id);
                setShowNodeConfig(false);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNodeConfig(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Node Configuration Component
const NodeConfiguration = ({ node, onUpdate, onDelete }) => {
  const [config, setConfig] = useState(node.data.config || {});

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  const renderEmailConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Email Subject"
          value={config.subject || ''}
          onChange={(e) => handleConfigChange('subject', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Email Content"
          value={config.content || ''}
          onChange={(e) => handleConfigChange('content', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Template</InputLabel>
          <Select
            value={config.template || 'default'}
            label="Template"
            onChange={(e) => handleConfigChange('template', e.target.value)}
          >
            <MenuItem value="default">Default Template</MenuItem>
            <MenuItem value="welcome">Welcome Template</MenuItem>
            <MenuItem value="promotional">Promotional Template</MenuItem>
            <MenuItem value="newsletter">Newsletter Template</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderTriggerConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Trigger Type</InputLabel>
          <Select
            value={config.triggerType || 'behavior'}
            label="Trigger Type"
            onChange={(e) => handleConfigChange('triggerType', e.target.value)}
          >
            <MenuItem value="behavior">User Behavior</MenuItem>
            <MenuItem value="time">Time-based</MenuItem>
            <MenuItem value="event">Custom Event</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {config.triggerType === 'behavior' && (
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Behavior</InputLabel>
            <Select
              value={config.behavior || 'open'}
              label="Behavior"
              onChange={(e) => handleConfigChange('behavior', e.target.value)}
            >
              <MenuItem value="open">Email Open</MenuItem>
              <MenuItem value="click">Email Click</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="idle">Idle (No Activity)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );

  const renderConditionConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Value"
          value={config.value || 0}
          onChange={(e) => handleConfigChange('value', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Unit</InputLabel>
          <Select
            value={config.unit || 'days'}
            label="Unit"
            onChange={(e) => handleConfigChange('unit', e.target.value)}
          >
            <MenuItem value="minutes">Minutes</MenuItem>
            <MenuItem value="hours">Hours</MenuItem>
            <MenuItem value="days">Days</MenuItem>
            <MenuItem value="weeks">Weeks</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderConfig = () => {
    switch (node.data.type) {
      case 'email':
        return renderEmailConfig();
      case 'trigger':
        return renderTriggerConfig();
      case 'condition':
        return renderConditionConfig();
      case 'delay':
        return renderConditionConfig(); // Same as condition for delay
      default:
        return <Typography>No configuration available</Typography>;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{node.data.label}</Typography>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >
          Delete Node
        </Button>
      </Box>
      {renderConfig()}
    </Box>
  );
};

export default EmailFlowDesigner; 