import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
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

  // Debug logging
  console.log('WidgetConfigModal render - open:', open, 'widget:', widget?.type);

  useEffect(() => {
    if (widget) {
      console.log('Setting config from widget:', widget.config);
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
    console.log('Saving widget config:', config);
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
              <MenuItem value="doughnut">Doughnut Chart</MenuItem>
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
        <Grid item xs={12}>
          <Typography gutterBottom>Chart Colors</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['#1976d2', '#dc004e', '#388e3c', '#ff9800', '#9c27b0'].map((color, index) => (
              <Box
                key={index}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: config.colors?.[index] === color ? '3px solid #333' : '2px solid #ccc',
                }}
                onClick={() => {
                  const newColors = [...(config.colors || ['#1976d2', '#dc004e', '#388e3c'])];
                  newColors[index] = color;
                  handleConfigChange('colors', newColors);
                }}
              />
            ))}
          </Box>
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
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.sortable || false}
                onChange={(e) => handleConfigChange('sortable', e.target.checked)}
              />
            }
            label="Sortable"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.paginated || false}
                onChange={(e) => handleConfigChange('paginated', e.target.checked)}
              />
            }
            label="Paginated"
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
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Decimal Places"
            type="number"
            value={config.decimalPlaces || 0}
            onChange={(e) => handleConfigChange('decimalPlaces', parseInt(e.target.value))}
            inputProps={{ min: 0, max: 4 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Metric Color</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['#1976d2', '#dc004e', '#388e3c', '#ff9800', '#9c27b0'].map((color) => (
              <Box
                key={color}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: config.color === color ? '3px solid #333' : '2px solid #ccc',
                }}
                onClick={() => handleConfigChange('color', color)}
              />
            ))}
          </Box>
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
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Font Weight</InputLabel>
            <Select
              value={config.fontWeight || 'normal'}
              label="Font Weight"
              onChange={(e) => handleConfigChange('fontWeight', e.target.value)}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="bold">Bold</MenuItem>
              <MenuItem value="lighter">Light</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Text Color</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['#000000', '#333333', '#666666', '#1976d2', '#dc004e'].map((color) => (
              <Box
                key={color}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: config.color === color ? '3px solid #333' : '2px solid #ccc',
                }}
                onClick={() => handleConfigChange('color', color)}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderImageSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Image Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Image URL"
            value={config.imageUrl || ''}
            onChange={(e) => handleConfigChange('imageUrl', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Alt Text"
            value={config.altText || ''}
            onChange={(e) => handleConfigChange('altText', e.target.value)}
            placeholder="Description of the image"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Caption"
            value={config.caption || ''}
            onChange={(e) => handleConfigChange('caption', e.target.value)}
            placeholder="Image caption"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.showCaption || false}
                onChange={(e) => handleConfigChange('showCaption', e.target.checked)}
              />
            }
            label="Show Caption"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={config.maintainAspectRatio || true}
                onChange={(e) => handleConfigChange('maintainAspectRatio', e.target.checked)}
              />
            }
            label="Maintain Aspect Ratio"
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
      case 'image':
        return renderImageSettings();
      default:
        return (
          <Typography color="text.secondary">
            No specific settings available for this widget type.
          </Typography>
        );
    }
  };

  const renderStyleSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Style Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            label="Border Radius (px)"
            value={config.borderRadius || 4}
            onChange={(e) => handleConfigChange('borderRadius', parseInt(e.target.value))}
            inputProps={{ min: 0, max: 20 }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            label="Padding (px)"
            value={config.padding || 16}
            onChange={(e) => handleConfigChange('padding', parseInt(e.target.value))}
            inputProps={{ min: 0, max: 50 }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.showBorder || false}
                onChange={(e) => handleConfigChange('showBorder', e.target.checked)}
              />
            }
            label="Show Border"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.showShadow || false}
                onChange={(e) => handleConfigChange('showShadow', e.target.checked)}
              />
            }
            label="Show Shadow"
          />
        </Grid>
      </Grid>
    </Box>
  );

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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          {tabs.map((tab, index) => (
            <Button
              key={index}
              onClick={() => setActiveTab(index)}
              startIcon={tab.icon}
              sx={{
                mr: 1,
                borderRadius: 1,
                borderBottom: activeTab === index ? 2 : 0,
                borderColor: activeTab === index ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {activeTab === 0 && renderGeneralSettings()}
        {activeTab === 1 && renderWidgetSpecificSettings()}
        {activeTab === 2 && renderStyleSettings()}
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