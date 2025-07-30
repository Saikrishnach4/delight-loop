import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/axiosConfig';

const EmailCampaignBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      setCampaign({
        name: 'New Purchase Campaign',
        description: '',
        status: 'draft',
        emailTemplate: {
          subject: '',
          body: '',
          senderName: user?.username || ''
        },
        timeDelayTrigger: { enabled: false },
        behaviorTriggers: [],
        // Purchase Campaign Settings
        purchaseCampaignType: 'none',
        selectedPurchaseRecipients: [],
        purchaseFilter: {
          type: 'opens',
          threshold: 1
        },
        purchaseLinkText: '🛒 Purchase Now - $99.99',
        purchaseAmount: 99.99
      });
      setLoading(false);
    } else {
      fetchCampaign();
    }
  }, [id, user]);

  // Add keyboard shortcut to mark changes (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        markAsChanged();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/campaigns/${id}`);
      setCampaign(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = id === 'new' ? 'POST' : 'PUT';
      const url = id === 'new' ? '/api/campaigns' : `/api/campaigns/${id}`;

      // Debug: Log what we're saving
      console.log('💾 Saving campaign with data:', {
        purchaseCampaignType: campaign.purchaseCampaignType,
        selectedPurchaseRecipients: campaign.selectedPurchaseRecipients,
        purchaseFilter: campaign.purchaseFilter,
        purchaseLinkText: campaign.purchaseLinkText,
        purchaseAmount: campaign.purchaseAmount
      });

      const response = id === 'new' 
        ? await apiClient.post('/api/campaigns', campaign)
        : await apiClient.put(`/api/campaigns/${id}`, campaign);
      
      const savedCampaign = response.data;
      
      if (id === 'new') {
        navigate(`/campaigns/${savedCampaign._id}`);
      } else {
        setCampaign(savedCampaign);
      }
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiClient.put(`/api/campaigns/${id}`, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      setError(error.message);
    }
  };

  // Manual email sending removed - focus on purchase campaigns only

  const handleAddRecipient = async () => {
    if (!newRecipient.email.trim()) return;

    try {
      const response = await apiClient.post(`/api/campaigns/${id}/recipients`, newRecipient);
      setCampaign(response.data);
      setNewRecipient({ email: '', name: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRemoveRecipient = async (email) => {
    try {
      const response = await apiClient.delete(`/api/campaigns/${id}/recipients/${encodeURIComponent(email)}`);
      setCampaign(response.data);
    } catch (error) {
      setError(error.message);
    }
  };







  // Function to mark that there are unsaved changes
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Helper function to update campaign and mark as changed
  const updateCampaign = (updates) => {
    setCampaign({ ...campaign, ...updates });
    setHasUnsavedChanges(true);
  };

  const handleSendPurchaseCampaign = async () => {
    try {
      setSaving(true);
      setError(null);

      // Debug: Log current campaign settings
      console.log('Current campaign settings:', {
        purchaseCampaignType: campaign.purchaseCampaignType,
        selectedPurchaseRecipients: campaign.selectedPurchaseRecipients,
        purchaseFilter: campaign.purchaseFilter,
        purchaseLinkText: campaign.purchaseLinkText,
        purchaseAmount: campaign.purchaseAmount
      });

      // Validate purchase campaign settings
      if (!campaign.purchaseCampaignType || campaign.purchaseCampaignType === 'none') {
        alert('❌ Please configure purchase campaign settings first. Select a purchase campaign type and recipients.');
        return;
      }

      if (campaign.purchaseCampaignType === 'selected' && (!campaign.selectedPurchaseRecipients || campaign.selectedPurchaseRecipients.length === 0)) {
        alert('❌ Please select at least one recipient for the purchase campaign.');
        return;
      }

      // First save the campaign to ensure all settings are saved
      console.log('Saving campaign with purchase settings...');
      await handleSave();

      // Wait a moment for the save to complete and fetch the updated campaign
      console.log('Waiting for save to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchCampaign();

      // Debug: Log campaign after save and fetch
      console.log('Campaign after save and fetch:', {
        purchaseCampaignType: campaign.purchaseCampaignType,
        selectedPurchaseRecipients: campaign.selectedPurchaseRecipients
      });

      // Double-check the campaign settings before sending
      if (!campaign.purchaseCampaignType || campaign.purchaseCampaignType === 'none') {
        alert('❌ Campaign settings not saved properly. Please try saving the campaign again.');
        return;
      }

      // Send purchase campaign
      const response = await apiClient.post(`/api/campaigns/${id}/send-purchase-campaign`);
      const result = response.data;

      let message = `✅ Purchase campaign sent successfully!\n\nSent to: ${result.sentCount} recipients\nFailed: ${result.failedEmails.length} recipients\n\n${result.message}`;
      
      if (result.triggersScheduled) {
        message += `\n\n⏰ Triggers Scheduled:`;
        if (result.triggersScheduled.idleTriggers > 0) {
          message += `\n• Idle triggers: ${result.triggersScheduled.idleTriggers} (${result.triggersScheduled.idleTimeMinutes} minutes)`;
        }
        if (result.triggersScheduled.timeDelayTriggers > 0) {
          message += `\n• Time delay triggers: ${result.triggersScheduled.timeDelayTriggers}`;
        }
        message += `\n\n💡 Users will receive idle reminders if they don't open/click within the configured time!`;
      }
      
      alert(message);
      
      // Refresh campaign data
      await fetchCampaign();

    } catch (error) {
      console.error('Error sending purchase campaign:', error);
      setError(error.message);
      alert(`❌ Failed to send purchase campaign: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box p={3}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {id === 'new' ? 'Create Purchase Campaign' : 'Edit Purchase Campaign'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          {id !== 'new' && campaign && (
            <>
              <Chip 
                label={campaign.status} 
                color={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'default'}
                sx={{ mr: 1 }}
              />
              {campaign.status === 'draft' && (
                <Button
                  variant="outlined"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStatusChange('active')}
                >
                  Activate
                </Button>
              )}
              {campaign.status === 'active' && (
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={() => handleStatusChange('paused')}
                >
                  Pause
                </Button>
              )}
              {campaign.status === 'paused' && (
                <Button
                  variant="outlined"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStatusChange('active')}
                >
                  Activate
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<BarChartIcon />}
                onClick={() => navigate(`/campaigns/${id}/analytics`)}
              >
                View Analytics
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Campaign'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Campaign Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campaign Details
              </Typography>
              
              <TextField
                fullWidth
                label="Campaign Name"
                value={campaign.name}
                onChange={(e) => updateCampaign({ name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={campaign.description}
                onChange={(e) => updateCampaign({ description: e.target.value })}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>



        {/* Time Delay Trigger */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Delay Trigger
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Send follow-up email after:
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  label="Days"
                  value={campaign.timeDelayTrigger?.days || 0}
                  onChange={(e) => setCampaign({
                    ...campaign,
                    timeDelayTrigger: {
                      ...campaign.timeDelayTrigger,
                      days: parseInt(e.target.value) || 0
                    }
                  })}
                  sx={{ width: 80, mr: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Hours"
                  value={campaign.timeDelayTrigger?.hours || 0}
                  onChange={(e) => setCampaign({
                    ...campaign,
                    timeDelayTrigger: {
                      ...campaign.timeDelayTrigger,
                      hours: parseInt(e.target.value) || 0
                    }
                  })}
                  sx={{ width: 80, mr: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Minutes"
                  value={campaign.timeDelayTrigger?.minutes || 0}
                  onChange={(e) => setCampaign({
                    ...campaign,
                    timeDelayTrigger: {
                      ...campaign.timeDelayTrigger,
                      minutes: parseInt(e.target.value) || 0
                    }
                  })}
                  sx={{ width: 80, mr: 2 }}
                />
                <Button
                  size="small"
                  variant={campaign.timeDelayTrigger?.enabled ? "contained" : "outlined"}
                  onClick={() => setCampaign({
                    ...campaign,
                    timeDelayTrigger: {
                      ...campaign.timeDelayTrigger,
                      enabled: !campaign.timeDelayTrigger?.enabled
                    }
                  })}
                >
                  {campaign.timeDelayTrigger?.enabled ? 'Enabled' : 'Enable'}
                </Button>
              </Box>
              
              {campaign.timeDelayTrigger?.enabled && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Follow-up Email:
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Subject"
                    value={campaign.timeDelayTrigger?.followUpEmail?.subject || ''}
                    onChange={(e) => setCampaign({
                      ...campaign,
                      timeDelayTrigger: {
                        ...campaign.timeDelayTrigger,
                        followUpEmail: {
                          ...campaign.timeDelayTrigger.followUpEmail,
                          subject: e.target.value
                        }
                      }
                    })}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    label="Body"
                    value={campaign.timeDelayTrigger?.followUpEmail?.body || ''}
                    onChange={(e) => setCampaign({
                      ...campaign,
                      timeDelayTrigger: {
                        ...campaign.timeDelayTrigger,
                        followUpEmail: {
                          ...campaign.timeDelayTrigger.followUpEmail,
                          body: e.target.value
                        }
                      }
                    })}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Triggers for Purchase Campaigns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Behavior Triggers for Purchase Campaigns
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure automatic follow-up emails based on user behavior with purchase campaigns. Idle triggers are especially useful for purchase campaigns.
              </Typography>
              
                              {['open', 'click', 'idle'].map(behavior => {
                const existingTrigger = campaign.behaviorTriggers?.find(t => t.behavior === behavior);
                
                return (
                  <Box key={behavior} mb={2} p={2} border="1px solid #ddd" borderRadius={1}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                        On {behavior}
                      </Typography>
                      <Button
                        size="small"
                        variant={existingTrigger?.enabled ? "contained" : "outlined"}
                        onClick={() => {
                          const updatedTriggers = campaign.behaviorTriggers || [];
                          const existingIndex = updatedTriggers.findIndex(t => t.behavior === behavior);
                          
                          if (existingIndex >= 0) {
                            updatedTriggers[existingIndex].enabled = !updatedTriggers[existingIndex].enabled;
                          } else {
                            updatedTriggers.push({
                              behavior,
                              enabled: true,
                              idleTime: { enabled: false, minutes: 30 },
      
                              followUpEmail: { subject: '', body: '' }
                            });
                          }
                          
                          setCampaign({
                            ...campaign,
                            behaviorTriggers: updatedTriggers
                          });
                        }}
                      >
                        {existingTrigger?.enabled ? 'Enabled' : 'Enable'}
                      </Button>
                    </Box>
                    
                    {existingTrigger?.enabled && (
                      <Box>
                        {/* Idle Time Configuration - Only for 'idle' behavior */}
                        {behavior === 'idle' && (
                          <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                            <Typography variant="subtitle2" gutterBottom>
                              Idle Time Configuration
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                              <FormControl size="small">
                                <InputLabel>Idle Time</InputLabel>
                                <Select
                                  value={existingTrigger.idleTime?.enabled ? 'enabled' : 'disabled'}
                                  onChange={(e) => {
                                    const updatedTriggers = campaign.behaviorTriggers.map(t =>
                                      t.behavior === behavior
                                        ? {
                                            ...t,
                                            idleTime: {
                                              ...t.idleTime,
                                              enabled: e.target.value === 'enabled'
                                            }
                                          }
                                        : t
                                    );
                                    setCampaign({
                                      ...campaign,
                                      behaviorTriggers: updatedTriggers
                                    });
                                  }}
                                  label="Idle Time"
                                >
                                  <MenuItem value="disabled">Disabled</MenuItem>
                                  <MenuItem value="enabled">Enabled</MenuItem>
                                </Select>
                              </FormControl>
                              
                              {existingTrigger.idleTime?.enabled && (
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Minutes"
                                  value={existingTrigger.idleTime?.minutes || 30}
                                  onChange={(e) => {
                                    const updatedTriggers = campaign.behaviorTriggers.map(t =>
                                      t.behavior === behavior
                                        ? {
                                            ...t,
                                            idleTime: {
                                              ...t.idleTime,
                                              minutes: parseInt(e.target.value) || 30
                                            }
                                          }
                                        : t
                                    );
                                    setCampaign({
                                      ...campaign,
                                      behaviorTriggers: updatedTriggers
                                    });
                                  }}
                                  sx={{ width: 100 }}
                                  inputProps={{ min: 1, max: 1440 }}
                                  helperText="1-1440 minutes"
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Send reminder email if user doesn't click/open within this time
                            </Typography>
                          </Box>
                        )}


                        
                        <TextField
                          fullWidth
                          size="small"
                          label="Subject"
                          value={existingTrigger.followUpEmail?.subject || ''}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            behaviorTriggers: campaign.behaviorTriggers.map(t =>
                              t.behavior === behavior
                                ? {
                                    ...t,
                                    followUpEmail: {
                                      ...t.followUpEmail,
                                      subject: e.target.value
                                    }
                                  }
                                : t
                            )
                          })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          label="Body"
                          value={existingTrigger.followUpEmail?.body || ''}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            behaviorTriggers: campaign.behaviorTriggers.map(t =>
                              t.behavior === behavior
                                ? {
                                    ...t,
                                    followUpEmail: {
                                      ...t.followUpEmail,
                                      body: e.target.value
                                    }
                                  }
                                : t
                            )
                          })}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Recipients for Purchase Campaigns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                👥 Recipients for Purchase Campaigns ({campaign.recipients?.length || 0})
              </Typography>
              
              {/* Recipient Summary */}
              <Box display="flex" justifyContent="space-around" mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
                <Box textAlign="center">
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Total</Typography>
                  <Typography variant="h3" color="primary.main" fontWeight="bold">
                    {campaign?.recipients?.length || 0}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Active</Typography>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {campaign?.recipients?.filter(r => r.status === 'active').length || 0}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add recipients who will receive purchase campaign emails. You can then select specific recipients or use filters in the purchase campaign settings.
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  size="small"
                  placeholder="Email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <TextField
                  size="small"
                  placeholder="Name (optional)"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.email.trim()}
                >
                  Add
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaign.recipients?.map((recipient, index) => (
                      <TableRow key={index}>
                        <TableCell>{recipient.email}</TableCell>
                        <TableCell>{recipient.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={recipient.status}
                            size="small"
                            color={recipient.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRecipient(recipient.email)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchase Campaign Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🛒 Purchase Campaign Settings
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure purchase campaigns and select specific users to send purchase links to
              </Typography>

              <Grid container spacing={3}>
                {/* Purchase Campaign Configuration */}
                <Grid item xs={12} md={6}>
                  <Box p={2} border="1px solid #ddd" borderRadius={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      Purchase Campaign Configuration
                    </Typography>
                    
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Purchase Campaign Type</InputLabel>
                      <Select
                        value={campaign.purchaseCampaignType || 'none'}
                        onChange={(e) => setCampaign({
                          ...campaign,
                          purchaseCampaignType: e.target.value
                        })}
                        label="Purchase Campaign Type"
                      >
                        <MenuItem value="none">No Purchase Campaign</MenuItem>
                        <MenuItem value="all">Send to All Recipients</MenuItem>
                        <MenuItem value="selected">Send to Selected Recipients</MenuItem>
                        {/* <MenuItem value="filtered">Send to Filtered Recipients</MenuItem> */}
                      </Select>
                    </FormControl>

                    {campaign.purchaseCampaignType === 'filtered' && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Filter Criteria
                        </Typography>
                        
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                          <InputLabel>Filter By</InputLabel>
                          <Select
                            value={campaign.purchaseFilter?.type || 'opens'}
                            onChange={(e) => setCampaign({
                              ...campaign,
                              purchaseFilter: {
                                ...campaign.purchaseFilter,
                                type: e.target.value
                              }
                            })}
                            label="Filter By"
                          >
                            <MenuItem value="opens">Users who opened emails</MenuItem>
                            <MenuItem value="clicks">Users who clicked links</MenuItem>
                            <MenuItem value="purchases">Users who made purchases</MenuItem>
                            <MenuItem value="inactive">Users who haven't engaged</MenuItem>
                            <MenuItem value="new">New recipients only</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Minimum threshold"
                          value={campaign.purchaseFilter?.threshold || 1}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            purchaseFilter: {
                              ...campaign.purchaseFilter,
                              threshold: parseInt(e.target.value) || 1
                            }
                          })}
                          sx={{ mb: 1 }}
                          helperText="e.g., minimum opens, clicks, or purchases"
                        />
                      </Box>
                    )}

                    <TextField
                      fullWidth
                      size="small"
                      label="Purchase Link Text"
                      value={campaign.purchaseLinkText || '🛒 Purchase Now - $99.99'}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        purchaseLinkText: e.target.value
                      })}
                      sx={{ mb: 2 }}
                      helperText="Text to display on the purchase button"
                    />

                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Purchase Amount ($)"
                      value={campaign.purchaseAmount || 99.99}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        purchaseAmount: parseFloat(e.target.value) || 99.99
                      })}
                      sx={{ mb: 2 }}
                      helperText="Price to display on purchase button"
                    />
                  </Box>
                </Grid>

                {/* Selected Recipients for Purchase Campaign */}
                <Grid item xs={12} md={6}>
                  <Box p={2} border="1px solid #ddd" borderRadius={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      Selected Recipients for Purchase Campaign
                    </Typography>
                    
                    {campaign.purchaseCampaignType === 'selected' && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Select specific recipients to send purchase links to:
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={campaign.selectedPurchaseRecipients?.length === campaign.recipients?.length}
                                    indeterminate={campaign.selectedPurchaseRecipients?.length > 0 && campaign.selectedPurchaseRecipients?.length < campaign.recipients?.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCampaign({
                                          ...campaign,
                                          selectedPurchaseRecipients: campaign.recipients?.map(r => r.email) || []
                                        });
                                      } else {
                                        setCampaign({
                                          ...campaign,
                                          selectedPurchaseRecipients: []
                                        });
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {campaign.recipients?.map((recipient, index) => (
                                <TableRow key={index}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      checked={campaign.selectedPurchaseRecipients?.includes(recipient.email) || false}
                                      onChange={(e) => {
                                        const currentSelected = campaign.selectedPurchaseRecipients || [];
                                        if (e.target.checked) {
                                          setCampaign({
                                            ...campaign,
                                            selectedPurchaseRecipients: [...currentSelected, recipient.email]
                                          });
                                        } else {
                                          setCampaign({
                                            ...campaign,
                                            selectedPurchaseRecipients: currentSelected.filter(email => email !== recipient.email)
                                          });
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{recipient.email}</TableCell>
                                  <TableCell>{recipient.name || '-'}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={recipient.status}
                                      size="small"
                                      color={recipient.status === 'active' ? 'success' : 'default'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Selected: {campaign.selectedPurchaseRecipients?.length || 0} recipients
                        </Typography>
                      </Box>
                    )}

                    {campaign.purchaseCampaignType === 'filtered' && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Recipients matching your filter criteria:
                        </Typography>
                        
                        <Box p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h6" color="primary">
                            {campaign.filteredPurchaseRecipients?.length || 0} recipients
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            will receive purchase links based on your filter
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {campaign.purchaseCampaignType === 'all' && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          All active recipients will receive purchase links:
                        </Typography>
                        
                        <Box p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h6" color="primary">
                            {campaign.recipients?.filter(r => r.status === 'active').length || 0} recipients
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            will receive purchase links
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* {campaign.purchaseCampaignType !== 'none' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{ mt: 1 }}
                          onClick={async () => {
                            try {
                              const response = await apiClient.get(`/api/campaigns/${id}/purchase-settings`);
                              const result = response.data;
                              console.log('🔍 Purchase Settings Debug:', result);
                              alert(`Purchase Settings:\n${JSON.stringify(result.purchaseSettings, null, 2)}`);
                            } catch (error) {
                              console.error('Debug error:', error);
                              alert('Debug failed: ' + error.message);
                            }
                          }}
                        >
                          🔍 Debug Purchase Settings
                        </Button>
                        

                      </>
                    )} */}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>



        {/* Purchase Campaign Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🛒 Purchase Campaign Actions
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure your purchase campaign settings above, then send purchase emails to your selected recipients.
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Save Campaign Button - Always visible */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ 
                    backgroundColor: hasUnsavedChanges ? '#ff9800' : '#1976d2',
                    '&:hover': {
                      backgroundColor: hasUnsavedChanges ? '#f57c00' : '#1565c0'
                    }
                  }}
                >
                  {saving ? <CircularProgress size={20} /> : hasUnsavedChanges ? '💾 Save Campaign*' : '💾 Save Campaign'}
                </Button>

                {campaign.purchaseCampaignType !== 'none' && (
                  <>
                    {hasUnsavedChanges && (
                      <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
                        ⚠️ You have unsaved changes. Please save the campaign first before sending emails.
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<EmailIcon />}
                      onClick={handleSendPurchaseCampaign}
                      disabled={saving || campaign.status !== 'active' || hasUnsavedChanges}
                    >
                      {saving ? <CircularProgress size={20} /> : '🛒 Send Purchase Campaign'}
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate(`/campaigns/${id}/analytics`)}
                >
                  View Analytics
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => navigate('/campaigns')}
                >
                  Back to Campaigns
                </Button>
              </Box>
              
              {campaign.purchaseCampaignType === 'none' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Configure purchase campaign settings above to enable sending purchase emails.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase campaign functionality is now the primary focus */}
    </Box>
  );
};

export default EmailCampaignBuilder; 