import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider,
  Alert,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  Science as ScienceIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const ABTestingPanel = ({ campaign, onSave }) => {
  const [abTest, setAbTest] = useState({
    enabled: false,
    testType: 'subject',
    variants: [
      { id: 'A', name: 'Variant A', content: '', percentage: 50 },
      { id: 'B', name: 'Variant B', content: '', percentage: 50 }
    ],
    testSize: 1000,
    duration: 7,
    metric: 'open_rate',
    status: 'draft'
  });

  const handleVariantChange = (variantId, field, value) => {
    setAbTest(prev => ({
      ...prev,
      variants: prev.variants.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const handlePercentageChange = (variantId, value) => {
    const otherPercentage = 100 - value;
    
    setAbTest(prev => ({
      ...prev,
      variants: prev.variants.map(variant =>
        variant.id === variantId 
          ? { ...variant, percentage: value }
          : { ...variant, percentage: otherPercentage }
      ),
    }));
  };

  const getTestTypeLabel = (type) => {
    switch (type) {
      case 'subject': return 'Subject Line';
      case 'content': return 'Email Content';
      case 'sender': return 'Sender Name';
      case 'timing': return 'Send Time';
      default: return type;
    }
  };

  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'open_rate': return 'Open Rate';
      case 'click_rate': return 'Click Rate';
      case 'conversion_rate': return 'Conversion Rate';
      case 'revenue': return 'Revenue';
      default: return metric;
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ScienceIcon color="primary" />
        <Typography variant="h6">A/B Testing</Typography>
        <Chip 
          label={abTest.enabled ? 'Active' : 'Inactive'} 
          color={abTest.enabled ? 'success' : 'default'}
          size="small"
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={abTest.enabled}
            onChange={(e) => setAbTest(prev => ({ ...prev, enabled: e.target.checked }))}
          />
        }
        label="Enable A/B Testing"
        sx={{ mb: 2 }}
      />

      {abTest.enabled && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={abTest.testType}
                  label="Test Type"
                  onChange={(e) => setAbTest(prev => ({ ...prev, testType: e.target.value }))}
                >
                  <MenuItem value="subject">Subject Line</MenuItem>
                  <MenuItem value="content">Email Content</MenuItem>
                  <MenuItem value="sender">Sender Name</MenuItem>
                  <MenuItem value="timing">Send Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Success Metric</InputLabel>
                <Select
                  value={abTest.metric}
                  label="Success Metric"
                  onChange={(e) => setAbTest(prev => ({ ...prev, metric: e.target.value }))}
                >
                  <MenuItem value="open_rate">Open Rate</MenuItem>
                  <MenuItem value="click_rate">Click Rate</MenuItem>
                  <MenuItem value="conversion_rate">Conversion Rate</MenuItem>
                  <MenuItem value="revenue">Revenue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Test Size: {abTest.testSize.toLocaleString()} subscribers</Typography>
              <Slider
                value={abTest.testSize}
                onChange={(e, value) => setAbTest(prev => ({ ...prev, testSize: value }))}
                min={100}
                max={10000}
                step={100}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Duration: {abTest.duration} days</Typography>
              <Slider
                value={abTest.duration}
                onChange={(e, value) => setAbTest(prev => ({ ...prev, duration: value }))}
                min={1}
                max={30}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Test Variants
          </Typography>

          <Grid container spacing={3}>
            {abTest.variants.map((variant) => (
              <Grid item xs={12} md={6} key={variant.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{variant.name}</Typography>
                      <Chip label={`${variant.percentage}%`} color="primary" />
                    </Box>
                    
                    <TextField
                      fullWidth
                      label={`${getTestTypeLabel(abTest.testType)} ${variant.id}`}
                      value={variant.content}
                      onChange={(e) => handleVariantChange(variant.id, 'content', e.target.value)}
                      multiline
                      rows={abTest.testType === 'content' ? 4 : 2}
                      sx={{ mb: 2 }}
                    />

                    <Typography gutterBottom>Distribution: {variant.percentage}%</Typography>
                    <Slider
                      value={variant.percentage}
                      onChange={(e, value) => handlePercentageChange(variant.id, value)}
                      min={10}
                      max={90}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Test Configuration:</strong> {abTest.testSize.toLocaleString()} subscribers will receive 
              {abTest.variants.map(v => ` ${v.percentage}% ${v.name}`).join(' and')} over {abTest.duration} days. 
              Success will be measured by {getMetricLabel(abTest.metric)}.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => setAbTest(prev => ({ ...prev, status: 'running' }))}
              disabled={abTest.status === 'running'}
            >
              Start Test
            </Button>
            <Button
              variant="outlined"
              startIcon={<StopIcon />}
              onClick={() => setAbTest(prev => ({ ...prev, status: 'stopped' }))}
              disabled={abTest.status !== 'running'}
            >
              Stop Test
            </Button>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => console.log('View results')}
            >
              View Results
            </Button>
          </Box>
        </>
      )}

      {!abTest.enabled && (
        <Alert severity="info">
          Enable A/B testing to create different versions of your email and test which performs better.
          You can test subject lines, content, sender names, or send times.
        </Alert>
      )}
    </Box>
  );
};

export default ABTestingPanel; 