import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const CampaignAnalytics = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      console.log('📊 Analytics data received:', data);
      console.log('📊 Campaign data:', data.campaign);
      console.log('📊 Recipients data:', data.recipients);
      setAnalytics(data);
      setCampaign(data.campaign);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRecipientStatus = (recipient) => {
    if (recipient.status === 'unsubscribed') return 'Unsubscribed';
    if (recipient.manualEmailsCount === 0) return 'No Emails Sent';
    return 'Active';
  };

  const getEmailStatusIcon = (manualEmail) => {
    if (manualEmail.opened || manualEmail.clicked) {
      return <CheckCircleIcon color="success" fontSize="small" />;
    } else if (manualEmail.timeDelayEmailSent) {
      return <ScheduleIcon color="warning" fontSize="small" />;
    } else if (manualEmail.idleEmailSent) {
      return <WarningIcon color="error" fontSize="small" />;
    } else if (manualEmail.hasLinks) {
      return <LinkIcon color="info" fontSize="small" />;
    } else {
      return <EmailIcon color="action" fontSize="small" />;
    }
  };

  const getEmailStatusText = (manualEmail) => {
    const statuses = [];
    if (manualEmail.opened) statuses.push('Opened');
    if (manualEmail.clicked) statuses.push('Clicked');
    if (manualEmail.timeDelayEmailSent) statuses.push('Follow-up Sent');
    if (manualEmail.idleEmailSent) statuses.push('Idle Reminder Sent');
    
    if (statuses.length > 0) {
      return statuses.join(', ');
    } else if (manualEmail.hasLinks) {
      return 'With Links';
    } else {
      return 'Sent';
    }
  };

  const getEmailStatusColor = (manualEmail) => {
    if (manualEmail.opened || manualEmail.clicked) {
      return 'success';
    } else if (manualEmail.timeDelayEmailSent) {
      return 'warning';
    } else if (manualEmail.idleEmailSent) {
      return 'error';
    } else if (manualEmail.hasLinks) {
      return 'info';
    } else {
      return 'default';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const sent = new Date(date);
    const diffMs = now - sent;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box p={3}>
        <Alert severity="warning">No analytics data available</Alert>
      </Box>
    );
  }

  const totalRecipients = analytics.recipients?.length || 0;
  const activeRecipients = analytics.recipients?.filter(r => r.status === 'active').length || 0;
  const totalManualEmails = analytics.recipients?.reduce((sum, r) => sum + (r.manualEmailsCount || 0), 0) || 0;
  const totalFollowUps = analytics.recipients?.reduce((sum, r) => sum + (r.followUpsSent || 0), 0) || 0;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Campaign Analytics
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            onClick={fetchAnalytics}
            sx={{ mr: 2 }}
          >
            Refresh Analytics
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log('📊 Current analytics state:', analytics);
              console.log('📊 Current campaign state:', campaign);
            }}
            sx={{ mr: 2 }}
          >
            Debug Data
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              if (analytics?.recipients?.[0]?.email) {
                try {
                  const response = await fetch(`/api/campaigns/${campaignId}/test-interactions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                      recipientEmail: analytics.recipients[0].email,
                      action: 'open'
                    })
                  });
                  const result = await response.json();
                  console.log('🧪 Test open result:', result);
                  if (result.success) {
                    fetchAnalytics(); // Refresh analytics
                  }
                } catch (error) {
                  console.error('❌ Test open failed:', error);
                }
              }
            }}
            sx={{ mr: 1 }}
          >
            Test Open
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={async () => {
              if (analytics?.recipients?.[0]?.email) {
                try {
                  const response = await fetch(`/api/campaigns/${campaignId}/test-interactions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                      recipientEmail: analytics.recipients[0].email,
                      action: 'click'
                    })
                  });
                  const result = await response.json();
                  console.log('🧪 Test click result:', result);
                  if (result.success) {
                    fetchAnalytics(); // Refresh analytics
                  }
                } catch (error) {
                  console.error('❌ Test click failed:', error);
                }
              }
            }}
          >
            Test Click
          </Button>
        </Box>
      </Box>

      {campaign && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {campaign.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {campaign.description}
            </Typography>
            <Chip 
              label={campaign.status} 
              color={campaign.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="primary" gutterBottom>
                {totalRecipients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Recipients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="success.main" gutterBottom>
                {activeRecipients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Recipients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="info.main" gutterBottom>
                {analytics.totalSent || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Emails Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="secondary" gutterBottom>
                {analytics.totalOpens || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Opens
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.openRate || 0}% Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="warning.main" gutterBottom>
                {analytics.totalClicks || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clicks
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.clickRate || 0}% Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="error.main" gutterBottom>
                {totalFollowUps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow-ups Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Campaign Performance Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Campaign Performance Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Email Performance
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • <strong>Total Emails Sent:</strong> {analytics.totalSent || 0}
                </Typography>
                <Typography variant="body2">
                  • <strong>Total Opens:</strong> {analytics.totalOpens || 0} ({analytics.openRate || 0}% rate)
                </Typography>
                <Typography variant="body2">
                  • <strong>Total Clicks:</strong> {analytics.totalClicks || 0} ({analytics.clickRate || 0}% rate)
                </Typography>
                <Typography variant="body2">
                  • <strong>Total Follow-ups:</strong> {totalFollowUps}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Recipient Overview
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • <strong>Total Recipients:</strong> {totalRecipients}
                </Typography>
                <Typography variant="body2">
                  • <strong>Active Recipients:</strong> {activeRecipients}
                </Typography>
                <Typography variant="body2">
                  • <strong>Average Manual Emails per Recipient:</strong> {totalRecipients > 0 ? (totalManualEmails / totalRecipients).toFixed(1) : 0}
                </Typography>
                <Typography variant="body2">
                  • <strong>Average Follow-ups per Recipient:</strong> {totalRecipients > 0 ? (totalFollowUps / totalRecipients).toFixed(1) : 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recipients Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Recipient Analytics
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Manual Emails</TableCell>
                  <TableCell>Opens</TableCell>
                  <TableCell>Clicks</TableCell>
                  <TableCell>Follow-ups</TableCell>
                  <TableCell>Idle Emails</TableCell>
                  <TableCell>Open Rate</TableCell>
                  <TableCell>Click Rate</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Email History</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics?.recipients?.map((recipient, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {recipient.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{recipient.name || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRecipientStatus(recipient)}
                        color={recipient.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {recipient.manualEmailsCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="secondary" fontWeight="medium">
                        {recipient.totalOpens || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="warning.main" fontWeight="medium">
                        {recipient.totalClicks || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="info.main" fontWeight="medium">
                        {recipient.followUpsSent || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main" fontWeight="medium">
                        {recipient.idleEmailsSent || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="secondary">
                        {recipient.openRate || 0}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="warning.main">
                        {recipient.clickRate || 0}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {recipient.lastActivity 
                          ? formatTimeAgo(recipient.lastActivity)
                          : 'No activity'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {recipient.manualEmails?.map((email, emailIndex) => (
                          <Box key={emailIndex} display="flex" alignItems="center" mb={1}>
                            <Tooltip title={getEmailStatusText(email)}>
                              <IconButton size="small">
                                {getEmailStatusIcon(email)}
                              </IconButton>
                            </Tooltip>
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              {formatTimeAgo(email.sentAt)}
                              {email.hasLinks && (
                                <LinkIcon fontSize="small" sx={{ ml: 0.5, color: 'info.main' }} />
                              )}
                              {email.timeDelayEmailSent && (
                                <ScheduleIcon fontSize="small" sx={{ ml: 0.5, color: 'warning.main' }} />
                              )}
                              {email.idleEmailSent && (
                                <WarningIcon fontSize="small" sx={{ ml: 0.5, color: 'error.main' }} />
                              )}
                              {email.opened && (
                                <CheckCircleIcon fontSize="small" sx={{ ml: 0.5, color: 'secondary' }} />
                              )}
                              {email.clicked && (
                                <LinkIcon fontSize="small" sx={{ ml: 0.5, color: 'warning.main' }} />
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tracking Links Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tracking Links for Testing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use these links to test click tracking for each recipient
          </Typography>
          
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {analytics?.recipients?.map((recipient, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {recipient.email}
                </Typography>
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    label="Test URL"
                    placeholder="https://example.com"
                    sx={{ minWidth: 200 }}
                    onChange={(e) => {
                      const testUrl = e.target.value;
                      if (testUrl) {
                        const trackingLink = `http://localhost:5000/api/campaigns/track/click/${campaignId}/${encodeURIComponent(recipient.email)}?url=${encodeURIComponent(testUrl)}`;
                        // Store the link temporarily for this recipient
                        recipient.trackingLink = trackingLink;
                      }
                    }}
                  />
                  {recipient.trackingLink && (
                    <>
                      <TextField
                        size="small"
                        value={recipient.trackingLink}
                        InputProps={{ readOnly: true }}
                        sx={{ minWidth: 300 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          navigator.clipboard.writeText(recipient.trackingLink);
                          alert(`Tracking link for ${recipient.email} copied!`);
                        }}
                      >
                        Copy
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Debug Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Use the test buttons above to simulate opens and clicks, then check the console for detailed logs.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Campaign ID:</strong> {campaignId}
            </Typography>
            <Typography variant="body2">
              <strong>Total Recipients:</strong> {analytics?.recipients?.length || 0}
            </Typography>
            <Typography variant="body2">
              <strong>Campaign Analytics:</strong> {JSON.stringify(analytics?.totalSent || 0)} sent, {analytics?.totalOpens || 0} opens, {analytics?.totalClicks || 0} clicks
            </Typography>
            {analytics?.recipients?.map((recipient, index) => (
              <Box key={index} sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {recipient.email}
                </Typography>
                <Typography variant="caption">
                  Manual Emails: {recipient.manualEmailsCount}, Opens: {recipient.totalOpens}, Clicks: {recipient.totalClicks}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Status Legend
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <EmailIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">Manual Email Sent</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <LinkIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2">Email with Links</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2">Time Delay Follow-up</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2">Idle Reminder Sent</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2">Email Opened</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center">
                <LinkIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2">Link Clicked</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CampaignAnalytics; 