import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
  DataObject as DataIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const WidgetConfigModal = ({ widget, open, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (widget) {
      setConfig({ ...widget.config });
    }
  }, [widget]);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate({
      config: config
    });
    onClose();
  };

  const handleCancel = () => {
    setConfig({ ...widget.config });
    onClose();
  };

  const renderGeneralSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        General Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Widget Title"
            value={config.title || ''}
            onChange={(e) => handleConfigChange('title', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={config.description || ''}
            onChange={(e) => handleConfigChange('description', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.isVisible !== false}
                onChange={(e) => handleConfigChange('isVisible', e.target.checked)}
              />
            }
            label="Visible"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.refreshEnabled || false}
                onChange={(e) => handleConfigChange('refreshEnabled', e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderChartSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Chart Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={config.chartType || 'line'}
              label="Chart Type"
              onChange={(e) => handleConfigChange('chartType', e.target.value)}
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Data Source"
            value={config.dataSource || ''}
            onChange={(e) => handleConfigChange('dataSource', e.target.value)}
            placeholder="API endpoint or data source"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderTableSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Table Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Data Source"
            value={config.dataSource || ''}
            onChange={(e) => handleConfigChange('dataSource', e.target.value)}
            placeholder="API endpoint or data source"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Columns (comma-separated)"
            value={config.columns?.join(', ') || ''}
            onChange={(e) => handleConfigChange('columns', e.target.value.split(',').map(col => col.trim()))}
            placeholder="Name, Value, Status"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderMetricSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Metric Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Data Source"
            value={config.dataSource || ''}
            onChange={(e) => handleConfigChange('dataSource', e.target.value)}
            placeholder="API endpoint or data source"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Value Format</InputLabel>
            <Select
              value={config.format || 'number'}
              label="Value Format"
              onChange={(e) => handleConfigChange('format', e.target.value)}
            >
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="currency">Currency</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTextSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Text Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={6}
            value={config.content || ''}
            onChange={(e) => handleConfigChange('content', e.target.value)}
            placeholder="Enter your text content here..."
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            label="Font Size (px)"
            value={config.fontSize || 16}
            onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
            inputProps={{ min: 8, max: 72 }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderWidgetSpecificSettings = () => {
    switch (widget?.type) {
      case 'chart':
        return renderChartSettings();
      case 'table':
        return renderTableSettings();
      case 'metric':
        return renderMetricSettings();
      case 'text':
        return renderTextSettings();
      default:
        return (
          <Typography color="text.secondary">
            No specific settings available for this widget type.
          </Typography>
        );
    }
  };

  const tabs = [
    { label: 'General', icon: <SettingsIcon /> },
    { label: 'Data', icon: <DataIcon /> },
    { label: 'Style', icon: <PaletteIcon /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Configure {widget?.type} Widget
          </Typography>
          <IconButton onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {activeTab === 0 && renderGeneralSettings()}
        {activeTab === 1 && renderWidgetSpecificSettings()}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Style Settings
            </Typography>
            <Typography color="text.secondary">
              Style settings will be implemented in the next phase.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WidgetConfigModal; 