import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Palette as PaletteIcon,
  ColorLens as ColorLensIcon,
  Typography as TypographyIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

const getDefaultTheme = () => ({
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
    textSecondary: '#666666',
    border: '#e0e0e0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  spacing: {
    unit: 8,
    borderRadius: 4,
  },
  shadows: {
    enabled: true,
    intensity: 1,
  },
});

const ThemeCustomizer = ({ currentTheme, onThemeChange, onSave }) => {
  const [theme, setTheme] = useState(() => {
    // Ensure we always have a valid theme structure
    const defaultTheme = getDefaultTheme();
    return currentTheme ? { ...defaultTheme, ...currentTheme } : defaultTheme;
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorField, setActiveColorField] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Ensure we always have a valid theme structure when currentTheme changes
    const defaultTheme = getDefaultTheme();
    const newTheme = currentTheme ? { ...defaultTheme, ...currentTheme } : defaultTheme;
    setTheme(newTheme);
  }, [currentTheme]);

  const handleColorChange = (color) => {
    const newTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [activeColorField]: color.hex,
      },
      // Also update the main theme properties for backward compatibility
      [activeColorField]: color.hex,
    };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const openColorPicker = (field) => {
    setActiveColorField(field);
    setShowColorPicker(true);
  };

  const handleThemeChange = (field, value) => {
    const newTheme = {
      ...theme,
      [field]: value,
    };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleNestedChange = (section, field, value) => {
    const newTheme = {
      ...theme,
      [section]: {
        ...theme[section],
        [field]: value,
      },
    };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleSave = () => {
    onSave(theme);
  };

  const handleReset = () => {
    const defaultTheme = getDefaultTheme();
    setTheme(defaultTheme);
    onThemeChange(defaultTheme);
  };

  const exportTheme = () => {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target.result);
          setTheme(importedTheme);
          onThemeChange(importedTheme);
        } catch (error) {
          console.error('Error importing theme:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const renderColorSection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Colors
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(theme.colors || {}).map(([colorName, colorValue]) => (
          <Grid item xs={6} sm={4} key={colorName}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
              onClick={() => openColorPicker(colorName)}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: colorValue,
                  border: '2px solid #e0e0e0',
                }}
              />
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {colorName}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTypographySection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Typography
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Font Family</InputLabel>
            <Select
              value={theme.typography?.fontFamily || 'Roboto, sans-serif'}
              label="Font Family"
              onChange={(e) => handleNestedChange('typography', 'fontFamily', e.target.value)}
            >
              <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
              <MenuItem value="Arial, sans-serif">Arial</MenuItem>
              <MenuItem value="Helvetica, sans-serif">Helvetica</MenuItem>
              <MenuItem value="Georgia, serif">Georgia</MenuItem>
              <MenuItem value="Times New Roman, serif">Times New Roman</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Font Size: {theme.typography?.fontSize || 14}px</Typography>
          <Slider
            value={theme.typography?.fontSize || 14}
            onChange={(e, value) => handleNestedChange('typography', 'fontSize', value)}
            min={10}
            max={20}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Font Weight</InputLabel>
            <Select
              value={theme.typography?.fontWeight || 400}
              label="Font Weight"
              onChange={(e) => handleNestedChange('typography', 'fontWeight', e.target.value)}
            >
              <MenuItem value={300}>Light (300)</MenuItem>
              <MenuItem value={400}>Regular (400)</MenuItem>
              <MenuItem value={500}>Medium (500)</MenuItem>
              <MenuItem value={600}>Semi Bold (600)</MenuItem>
              <MenuItem value={700}>Bold (700)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Line Height: {theme.typography?.lineHeight || 1.5}</Typography>
          <Slider
            value={theme.typography?.lineHeight || 1.5}
            onChange={(e, value) => handleNestedChange('typography', 'lineHeight', value)}
            min={1}
            max={2}
            step={0.1}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderSpacingSection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Spacing & Layout
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Spacing Unit: {theme.spacing?.unit || 8}px</Typography>
          <Slider
            value={theme.spacing?.unit || 8}
            onChange={(e, value) => handleNestedChange('spacing', 'unit', value)}
            min={4}
            max={16}
            step={2}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Border Radius: {theme.spacing?.borderRadius || 4}px</Typography>
          <Slider
            value={theme.spacing?.borderRadius || 4}
            onChange={(e, value) => handleNestedChange('spacing', 'borderRadius', value)}
            min={0}
            max={16}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderEffectsSection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Effects
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={theme.shadows?.enabled || false}
                onChange={(e) => handleNestedChange('shadows', 'enabled', e.target.checked)}
              />
            }
            label="Enable Shadows"
          />
        </Grid>
        {theme.shadows?.enabled && (
          <Grid item xs={12}>
            <Typography gutterBottom>Shadow Intensity: {theme.shadows?.intensity || 1}</Typography>
            <Slider
              value={theme.shadows?.intensity || 1}
              onChange={(e, value) => handleNestedChange('shadows', 'intensity', value)}
              min={0}
              max={3}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderLivePreview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Live Preview
      </Typography>
      <Box
        sx={{
          p: 3,
          border: `1px solid ${theme.border || '#e0e0e0'}`,
          borderRadius: theme.spacing?.borderRadius || 4,
          backgroundColor: theme.background || '#ffffff',
          color: theme.text || '#000000',
          fontFamily: theme.typography?.fontFamily || 'Roboto, sans-serif',
          fontSize: theme.typography?.fontSize || 14,
          lineHeight: theme.typography?.lineHeight || 1.5,
          boxShadow: theme.shadows?.enabled ? `0 ${(theme.shadows?.intensity || 1) * 2}px ${(theme.shadows?.intensity || 1) * 4}px rgba(0,0,0,0.1)` : 'none',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: theme.primary || '#1976d2' }}>
          Sample Dashboard Title
        </Typography>
        <Typography variant="body1" paragraph>
          This is a sample text showing how your theme will look. The colors, typography, and spacing will be applied to your dashboard.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: theme.primary || '#1976d2',
              color: '#ffffff'
            }}
          >
            Primary Button
          </Button>
          <Button 
            variant="outlined" 
            sx={{ 
              borderColor: theme.secondary || '#dc004e',
              color: theme.secondary || '#dc004e'
            }}
          >
            Secondary Button
          </Button>
        </Box>
        <Box sx={{ mt: 2, p: 2, backgroundColor: theme.colors?.surface || '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This is a sample card with surface color.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const tabs = [
    { label: 'General', icon: <PaletteIcon /> },
    { label: 'Data', icon: <ColorLensIcon /> },
    { label: 'Style', icon: <PaletteIcon /> },
    { label: 'Preview', icon: <ColorLensIcon /> },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Theme Customizer</Typography>
          <Tooltip title="Real-time updates enabled">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main">
                Live
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export Theme">
            <IconButton onClick={exportTheme}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Theme">
            <IconButton component="label">
              <VisibilityOffIcon />
              <input
                type="file"
                accept=".json"
                onChange={importTheme}
                style={{ display: 'none' }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Theme">
            <IconButton onClick={handleReset}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Theme
          </Button>
        </Box>
      </Box>

      {/* Theme Sections */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderColorSection()}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            {renderTypographySection()}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            {renderSpacingSection()}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            {renderEffectsSection()}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            {renderLivePreview()}
          </Grid>
        </Grid>
      </Box>

      {/* Color Picker Dialog */}
      <Dialog
        open={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent>
          <ChromePicker
            color={theme.colors?.[activeColorField] || '#000000'}
            onChange={handleColorChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColorPicker(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemeCustomizer; 