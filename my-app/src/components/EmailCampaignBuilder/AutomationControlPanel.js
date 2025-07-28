import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const AutomationControlPanel = ({ campaign, onStatusChange }) => {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (campaign?._id) {
      fetchAutomationStatus();
    }
  }, [campaign?._id]);

  const fetchAutomationStatus = async () => {
    try {
      const response = await axios.get(`/api/campaigns/${campaign._id}/automation-status`);
      setAutomationStatus(response.data);
    } catch (error) {
      console.error('Error fetching automation status:', error);
    }
  };

  const handleStartAutomation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/campaigns/${campaign._id}/start-automation`);
      setAutomationStatus(response.data.automationStatus);
      toast.success('Campaign automation started successfully!');
      onStatusChange?.('active');
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAutomation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/campaigns/${campaign._id}/stop-automation`);
      setAutomationStatus(response.data.automationStatus);
      toast.success('Campaign automation stopped successfully!');
      onStatusChange?.('paused');
    } catch (error) {
      console.error('Error stopping automation:', error);
      toast.error('Failed to stop automation');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayIcon />;
      case 'paused':
        return <StopIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (!campaign) return null;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <TimelineIcon />
          Automation Control
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={campaign.status}
            color={getStatusColor(campaign.status)}
            icon={getStatusIcon(campaign.status)}
            size="small"
          />
          <Tooltip title="Refresh Status">
            <IconButton onClick={fetchAutomationStatus} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Campaign Status
              </Typography>
              <Typography variant="h4" gutterBottom>
                {campaign.status === 'active' ? 'Running' : 'Stopped'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {campaign.status === 'active' 
                  ? 'Automation is actively processing subscribers'
                  : 'Automation is paused or not started'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Subscribers
              </Typography>
              <Typography variant="h4" gutterBottom>
                {automationStatus?.activeSubscribers || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active subscribers out of {automationStatus?.totalSubscribers || 0} total
              </Typography>
              {automationStatus?.totalSubscribers > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={(automationStatus?.activeSubscribers / automationStatus?.totalSubscribers) * 100}
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3} display="flex" gap={2} flexWrap="wrap">
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayIcon />}
          onClick={handleStartAutomation}
          disabled={isLoading || campaign.status === 'active'}
          size="large"
        >
          Start Automation
        </Button>
        
        <Button
          variant="contained"
          color="error"
          startIcon={<StopIcon />}
          onClick={handleStopAutomation}
          disabled={isLoading || campaign.status !== 'active'}
          size="large"
        >
          Stop Automation
        </Button>

        <Button
          variant="outlined"
          startIcon={<InfoIcon />}
          onClick={() => setShowDetails(true)}
          size="large"
        >
          View Details
        </Button>
      </Box>

      {automationStatus?.automationStatus?.scheduledJobs > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {automationStatus.automationStatus.scheduledJobs} emails are scheduled for future delivery
        </Alert>
      )}

      {/* Automation Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <TimelineIcon />
            Automation Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Campaign Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Steps"
                    secondary={campaign.steps?.length || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Subscribers"
                    secondary={automationStatus?.totalSubscribers || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Scheduled Jobs"
                    secondary={automationStatus?.automationStatus?.scheduledJobs || 0}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Automation Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Automation Active"
                    secondary={automationStatus?.automationStatus?.isActive ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Campaign Status"
                    secondary={automationStatus?.campaignStatus || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Active Campaigns"
                    secondary={automationStatus?.automationStatus?.activeCampaigns || 0}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          {campaign.steps && campaign.steps.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Campaign Steps
              </Typography>
              <List dense>
                {campaign.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Step ${step.stepNumber}: ${step.name}`}
                      secondary={`Trigger: ${step.triggers.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AutomationControlPanel;