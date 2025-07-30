import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { apiFetch } from '../services/apiService';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    emailTemplate: {
      subject: '',
      body: '',
      senderName: ''
    },
    timeDelayTrigger: { enabled: false },
    behaviorTriggers: []
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiFetch('api/campaigns/templates/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCampaign)
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const campaign = await response.json();
      setCampaigns([campaign, ...campaigns]);
      setCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        emailTemplate: {
          subject: '',
          body: '',
          senderName: ''
        },
        timeDelayTrigger: { enabled: false },
        behaviorTriggers: []
      });
      
      navigate(`/campaigns/${campaign._id}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const campaignData = {
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        description: selectedTemplate.description,
        emailTemplate: selectedTemplate.emailTemplate,
        triggers: selectedTemplate.triggers
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign from template');
      }

      const campaign = await response.json();
      setCampaigns([campaign, ...campaigns]);
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
      
      navigate(`/campaigns/${campaign._id}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleMenuOpen = (event, campaign) => {
    setAnchorEl(event.currentTarget);
    setSelectedCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCampaign(null);
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      handleMenuClose();
      return;
    }

    try {
      const response = await apiFetch(`api/campaigns/${selectedCampaign._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      setCampaigns(campaigns.filter(c => c._id !== selectedCampaign._id));
      handleMenuClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      const response = await apiFetch(`api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign status');
      }

      setCampaigns(campaigns.map(c => 
        c._id === campaignId ? { ...c, status: newStatus } : c
      ));
      
      // Close the menu after status change
      handleMenuClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleViewAnalytics = (campaignId) => {
    navigate(`/campaigns/${campaignId}/analytics`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'default';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getTriggerText = (campaign) => {
    if (campaign.timeDelayTrigger?.enabled) {
      const days = campaign.timeDelayTrigger.days || 0;
      const hours = campaign.timeDelayTrigger.hours || 0;
      const minutes = campaign.timeDelayTrigger.minutes || 0;
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} delay`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} delay`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} delay`;
      return 'Time delay';
    }
    
    if (campaign.behaviorTriggers?.length > 0) {
      const behaviors = campaign.behaviorTriggers.map(t => t.behavior).join(', ');
      return `On ${behaviors}`;
    }
    
    return 'Manual only';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Email Campaigns
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => setTemplateDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Use Template
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Campaign
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No campaigns yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first email campaign to start engaging with your audience
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Analytics</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1">{campaign.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {campaign.description || 'No description'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={campaign.status} 
                      color={getStatusColor(campaign.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        Sent: {campaign.analytics?.totalSent || 0}
                      </Typography>
                      <Typography variant="body2">
                        Opens: {campaign.analytics?.totalOpens || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, campaign)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Email Template
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject Line"
                value={newCampaign.emailTemplate.subject}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  emailTemplate: { ...newCampaign.emailTemplate, subject: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Email Body"
                value={newCampaign.emailTemplate.body}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  emailTemplate: { ...newCampaign.emailTemplate, body: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sender Name"
                value={newCampaign.emailTemplate.senderName}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  emailTemplate: { ...newCampaign.emailTemplate, senderName: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCampaign} 
            variant="contained"
            disabled={!newCampaign.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Choose a Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Chip 
                      label={getTriggerText(template)} 
                      size="small" 
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateFromTemplate} 
            variant="contained"
            disabled={!selectedTemplate}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/campaigns/${selectedCampaign?._id}`);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {selectedCampaign?.status === 'draft' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedCampaign._id, 'active');
            handleMenuClose();
          }}>
            <PlayIcon sx={{ mr: 1 }} />
            Activate
          </MenuItem>
        )}
        {selectedCampaign?.status === 'active' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedCampaign._id, 'paused');
            handleMenuClose();
          }}>
            <PauseIcon sx={{ mr: 1 }} />
            Pause
          </MenuItem>
        )}
        {selectedCampaign?.status === 'paused' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedCampaign._id, 'active');
            handleMenuClose();
          }}>
            <PlayIcon sx={{ mr: 1 }} />
            Activate
          </MenuItem>
        )}
        <MenuItem onClick={() => handleViewAnalytics(selectedCampaign?._id)}>
          <BarChartIcon sx={{ mr: 1 }} />
          Analytics
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EmailCampaigns; 