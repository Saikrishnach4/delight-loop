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
  TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const EmailCampaignBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });
  const [testBehavior, setTestBehavior] = useState({ email: '', behavior: 'open' });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (id === 'new') {
      setCampaign({
        name: 'New Campaign',
        description: '',
        status: 'draft',
        emailTemplate: {
          subject: '',
          body: '',
          senderName: user?.username || ''
        },
        timeDelayTrigger: { enabled: false },
        behaviorTriggers: []
      });
      setLoading(false);
    } else {
      fetchCampaign();
    }
  }, [id, user]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }

      const data = await response.json();
      setCampaign(data);
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

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campaign)
      });

      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }

      const savedCampaign = await response.json();
      
      if (id === 'new') {
        navigate(`/campaigns/${savedCampaign._id}`);
      } else {
        setCampaign(savedCampaign);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
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

      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientEmails: [] }) // Send to all recipients
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      alert(`Email sent to ${result.sent} recipients`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddRecipient = async () => {
    if (!newRecipient.email.trim()) return;

    try {
      const response = await fetch(`/api/campaigns/${id}/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRecipient)
      });

      if (!response.ok) {
        throw new Error('Failed to add recipient');
      }

      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      setNewRecipient({ email: '', name: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRemoveRecipient = async (email) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/recipients/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove recipient');
      }

      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleTestBehavior = async () => {
    try {
      setTestResult(null);
      const response = await fetch(`/api/campaigns/${id}/test-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userEmail: testBehavior.email,
          behavior: testBehavior.behavior
        })
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        // Refresh campaign data to see updated analytics
        fetchCampaign();
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test behavior' });
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <IconButton onClick={() => navigate('/campaigns')}>
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{campaign.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {campaign.description || 'No description'}
            </Typography>
          </Grid>
          <Grid item>
            <Chip 
              label={campaign.status} 
              color={campaign.status === 'active' ? 'success' : 'default'}
              sx={{ mr: 2 }}
            />
            {campaign.status === 'draft' ? (
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => handleStatusChange('active')}
                sx={{ mr: 1 }}
              >
                Activate
              </Button>
            ) : campaign.status === 'active' ? (
              <Button
                variant="outlined"
                startIcon={<PauseIcon />}
                onClick={() => handleStatusChange('paused')}
                sx={{ mr: 1 }}
              >
                Pause
              </Button>
            ) : null}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={campaign.description}
                onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Email Template */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Template
              </Typography>
              
              <TextField
                fullWidth
                label="Subject Line"
                value={campaign.emailTemplate?.subject || ''}
                onChange={(e) => setCampaign({
                  ...campaign,
                  emailTemplate: { ...campaign.emailTemplate, subject: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Email Body"
                value={campaign.emailTemplate?.body || ''}
                onChange={(e) => setCampaign({
                  ...campaign,
                  emailTemplate: { ...campaign.emailTemplate, body: e.target.value }
                })}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sender Name"
                    value={campaign.emailTemplate?.senderName || ''}
                    onChange={(e) => setCampaign({
                      ...campaign,
                      emailTemplate: { ...campaign.emailTemplate, senderName: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
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

        {/* Behavior Triggers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Behavior Triggers
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send follow-up emails when users interact with your emails
              </Typography>
              
              {['open', 'click', 'idle'].map((behavior) => {
                const existingTrigger = campaign.behaviorTriggers?.find(t => t.behavior === behavior);
                return (
                  <Box key={behavior} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                        On {behavior}
                      </Typography>
                      <Button
                        size="small"
                        variant={existingTrigger?.enabled ? "contained" : "outlined"}
                        onClick={() => {
                          if (existingTrigger) {
                            // Toggle existing trigger
                            setCampaign({
                              ...campaign,
                              behaviorTriggers: campaign.behaviorTriggers.map(t =>
                                t.behavior === behavior
                                  ? { ...t, enabled: !t.enabled }
                                  : t
                              )
                            });
                          } else {
                            // Add new trigger
                            setCampaign({
                              ...campaign,
                              behaviorTriggers: [
                                ...(campaign.behaviorTriggers || []),
                                {
                                  behavior,
                                  enabled: true,
                                  followUpEmail: { subject: '', body: '' }
                                }
                              ]
                            });
                          }
                        }}
                      >
                        {existingTrigger?.enabled ? 'Enabled' : 'Enable'}
                      </Button>
                    </Box>
                    
                    {existingTrigger?.enabled && (
                      <Box>
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

        {/* Recipients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recipients ({campaign.recipients?.length || 0})
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add email addresses manually to send emails to specific recipients
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

        {/* Behavior Testing Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Behavior Triggers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Test open and click triggers for recipients
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Recipient Email"
                    value={testBehavior.email}
                    onChange={(e) => setTestBehavior(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter recipient email to test"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Behavior</InputLabel>
                    <Select
                      value={testBehavior.behavior}
                      onChange={(e) => setTestBehavior(prev => ({ ...prev, behavior: e.target.value }))}
                    >
                      <MenuItem value="open">Open Email</MenuItem>
                      <MenuItem value="click">Click Link</MenuItem>
                      <MenuItem value="idle">Idle</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleTestBehavior}
                    disabled={!testBehavior.email}
                    fullWidth
                  >
                    Test Behavior
                  </Button>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setTestResult(null)}
                    fullWidth
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {testResult && (
                <Box mt={2} p={2} bgcolor={testResult.success ? 'success.light' : 'error.light'} borderRadius={1}>
                  <Typography variant="body2" color={testResult.success ? 'success.dark' : 'error.dark'}>
                    <strong>Test Result:</strong> {testResult.message}
                    {testResult.followUpSent && (
                      <span> ✅ Follow-up email was sent!</span>
                    )}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={handleSendEmail}
                  disabled={campaign.status !== 'active' || !campaign.recipients?.length}
                >
                  Send Email Now
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => navigate('/campaigns')}
                >
                  Back to Campaigns
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailCampaignBuilder; 