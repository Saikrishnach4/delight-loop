import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const EmailCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns');
      const campaigns = response.data.campaigns || [];
      
      if (campaigns.length === 0) {
        // Create sample campaigns if none exist
        await createSampleCampaigns();
        // Fetch again after creating samples
        const newResponse = await axios.get('/api/campaigns');
        setCampaigns(newResponse.data.campaigns || []);
      } else {
        setCampaigns(campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const createSampleCampaigns = async () => {
    try {
      const sampleCampaigns = [
        {
          name: 'Welcome Series',
          description: 'Automated welcome emails for new subscribers',
          type: 'automated',
          status: 'active',
          steps: [],
          subscribers: [],
          settings: {},
        },
        {
          name: 'Product Launch',
          description: 'Announcement campaign for new product',
          type: 'manual',
          status: 'draft',
          steps: [],
          subscribers: [],
          settings: {},
        },
        {
          name: 'Newsletter',
          description: 'Weekly newsletter with updates and tips',
          type: 'scheduled',
          status: 'active',
          steps: [],
          subscribers: [],
          settings: {},
        },
      ];

      for (const campaign of sampleCampaigns) {
        await axios.post('/api/campaigns', campaign);
      }
      
      toast.success('Sample campaigns created successfully!');
    } catch (error) {
      console.error('Error creating sample campaigns:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`/api/campaigns/${campaignId}`);
        setCampaigns(campaigns.filter(c => (c._id || c.id) !== campaignId));
        toast.success('Campaign deleted successfully');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Email Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/campaigns/new')}
        >
          Create Campaign
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading campaigns...</Typography>
      ) : campaigns.length > 0 ? (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign._id || campaign.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {campaign.name}
                    </Typography>
                    <Chip
                      label={campaign.status}
                      color={getStatusColor(campaign.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {campaign.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Subscribers:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {Array.isArray(campaign.subscribers) ? campaign.subscribers.length : (campaign.subscribers || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Steps:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {Array.isArray(campaign.steps) ? campaign.steps.length : 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                      {campaign.type}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/campaigns/${campaign._id || campaign.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate(`/campaigns/${campaign._id || campaign.id}/analytics`)}
                  >
                    Analytics
                  </Button>
                  <Tooltip title="Delete Campaign">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(campaign._id || campaign.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, minHeight: '60vh' }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="40vh"
            textAlign="center"
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Email Campaigns Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create your first email campaign to start engaging with your audience.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/campaigns/new')}
            >
              Create Your First Campaign
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default EmailCampaigns; 