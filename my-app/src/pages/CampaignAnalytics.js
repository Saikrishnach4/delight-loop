import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Mouse as MouseIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const CampaignAnalytics = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!campaignResponse.ok) {
        throw new Error('Failed to fetch campaign');
      }

      const campaignData = await campaignResponse.json();
      setCampaign(campaignData);

      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      } else {
        // If analytics endpoint doesn't exist, use campaign data
        setAnalytics({
          totalSent: campaignData.analytics?.totalSent || 0,
          totalOpens: campaignData.analytics?.totalOpens || 0,
          totalClicks: campaignData.analytics?.totalClicks || 0,
          recipients: campaignData.recipients || []
        });
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateOpenRate = () => {
    if (!analytics || analytics.totalSent === 0) return 0;
    return ((analytics.totalOpens / analytics.totalSent) * 100).toFixed(1);
  };

  const calculateClickRate = () => {
    if (!analytics || analytics.totalSent === 0) return 0;
    return ((analytics.totalClicks / analytics.totalSent) * 100).toFixed(1);
  };

  const getRecipientStatus = (recipient) => {
    if (recipient.status === 'unsubscribed') return 'Unsubscribed';
    if (recipient.manualEmailSentAt) return 'Email Sent';
    return 'Pending';
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
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/campaigns')}
          sx={{ mr: 2 }}
        >
          Back to Campaigns
        </Button>
        <Typography variant="h4" component="h1">
          Campaign Analytics
        </Typography>
      </Box>

      {campaign && (
        <>
          {/* Campaign Info */}
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
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <EmailIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {analytics?.totalSent || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emails Sent
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <VisibilityIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {analytics?.totalOpens || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Opens ({calculateOpenRate()}%)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <MouseIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {analytics?.totalClicks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clicks ({calculateClickRate()}%)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <PeopleIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {analytics?.recipients?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Recipients
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recipients Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recipients Details
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Manual Email Sent</TableCell>
                      <TableCell>Time Delay Email</TableCell>
                      <TableCell>Last Activity</TableCell>
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
                          {recipient.manualEmailSentAt 
                            ? new Date(recipient.manualEmailSentAt).toLocaleString()
                            : 'Not sent'
                          }
                        </TableCell>
                        <TableCell>
                          {recipient.timeDelayEmailSent ? 'Sent' : 'Not sent'}
                        </TableCell>
                        <TableCell>
                          {recipient.lastActivity 
                            ? new Date(recipient.lastActivity).toLocaleString()
                            : 'No activity'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default CampaignAnalytics; 