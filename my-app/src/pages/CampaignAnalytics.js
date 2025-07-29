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
      setAnalytics(data);
      setCampaign(data.campaign);
    } catch (error) {
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
    if (manualEmail.timeDelayEmailSent && manualEmail.idleEmailSent) {
      return <CheckCircleIcon color="success" fontSize="small" />;
    } else if (manualEmail.timeDelayEmailSent) {
      return <ScheduleIcon color="warning" fontSize="small" />;
    } else if (manualEmail.hasLinks) {
      return <LinkIcon color="info" fontSize="small" />;
    } else {
      return <EmailIcon color="action" fontSize="small" />;
    }
  };

  const getEmailStatusText = (manualEmail) => {
    if (manualEmail.timeDelayEmailSent && manualEmail.idleEmailSent) {
      return 'Complete';
    } else if (manualEmail.timeDelayEmailSent) {
      return 'Follow-up Sent';
    } else if (manualEmail.hasLinks) {
      return 'With Links';
    } else {
      return 'Sent';
    }
  };

  const getEmailStatusColor = (manualEmail) => {
    if (manualEmail.timeDelayEmailSent && manualEmail.idleEmailSent) {
      return 'success';
    } else if (manualEmail.timeDelayEmailSent) {
      return 'warning';
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="info.main" gutterBottom>
                {totalManualEmails}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manual Emails Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="warning.main" gutterBottom>
                {totalFollowUps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow-up Emails Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recipients Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recipient Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Manual Emails</TableCell>
                  <TableCell>Follow-ups</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Email History</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics?.recipients?.map((recipient, index) => (
                  <TableRow key={index}>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>{recipient.name || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRecipientStatus(recipient)}
                        color={recipient.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {recipient.manualEmailsCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {recipient.followUpsSent || 0}
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

      {/* Legend */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Status Legend
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center">
                <EmailIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">Manual Email Sent</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center">
                <LinkIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2">Email with Links</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center">
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2">Follow-up Sent</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2">Complete (All Sent)</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CampaignAnalytics; 