import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  OpenInNew as OpenIcon,
  Click as ClickIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const EmailCampaignWidget = ({ widget, onUpdate }) => {
  const [campaignData, setCampaignData] = useState({
    totalSubscribers: 1250,
    activeSubscribers: 1180,
    totalSent: 1150,
    totalOpens: 345,
    totalClicks: 89,
    openRate: 30.0,
    clickRate: 7.7,
    conversionRate: 2.1,
  });

  useEffect(() => {
    // In a real app, this would fetch campaign data from the API
    // For now, we'll use mock data
  }, [widget.config?.campaignId]);

  const getDisplayMode = () => {
    return widget.config?.displayMode || 'overview';
  };

  const renderOverview = () => (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Paper sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {campaignData.totalSubscribers.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Subscribers
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6}>
        <Paper sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {campaignData.openRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Open Rate
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6}>
        <Paper sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h4" color="secondary.main">
            {campaignData.clickRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click Rate
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6}>
        <Paper sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {campaignData.conversionRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Conversion Rate
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Campaign Performance
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Email Opens</Typography>
          <Typography variant="body2">{campaignData.openRate}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={campaignData.openRate} 
          color="success"
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Email Clicks</Typography>
          <Typography variant="body2">{campaignData.clickRate}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={campaignData.clickRate} 
          color="secondary"
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Conversions</Typography>
          <Typography variant="body2">{campaignData.conversionRate}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={campaignData.conversionRate} 
          color="warning"
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    </Box>
  );

  const renderSubscribers = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Subscriber Stats
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">
            {campaignData.totalSubscribers.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Subscribers
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <EmailIcon sx={{ mr: 1, color: 'success.main' }} />
        <Box>
          <Typography variant="h5">
            {campaignData.activeSubscribers.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Active Subscribers
          </Typography>
        </Box>
      </Box>
      
      <Chip
        label={`${((campaignData.activeSubscribers / campaignData.totalSubscribers) * 100).toFixed(1)}% Active`}
        color="success"
        variant="outlined"
        size="small"
      />
    </Box>
  );

  const renderContent = () => {
    switch (getDisplayMode()) {
      case 'analytics':
        return renderAnalytics();
      case 'subscribers':
        return renderSubscribers();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {widget.config?.title || 'Email Campaign'}
        </Typography>
        <Chip
          label={getDisplayMode()}
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default EmailCampaignWidget; 