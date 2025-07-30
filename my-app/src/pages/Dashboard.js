import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: ''
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requestCollaborationCount } = useDashboard();

  // Refresh collaboration counts for all dashboards
  const refreshCollaborationCounts = () => {
    dashboards.forEach(dashboard => {
      requestCollaborationCount(dashboard._id);
    });
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  // Refresh collaboration counts when dashboards are loaded
  useEffect(() => {
    if (dashboards.length > 0) {
      // Small delay to ensure socket is ready
      const timer = setTimeout(() => {
        refreshCollaborationCounts();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dashboards]);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboards', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);
      } else {
        console.error('Failed to fetch dashboards');
        toast.error('Failed to load dashboards');
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      toast.error('Error loading dashboards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      // Create a default theme for new dashboards
      const defaultTheme = {
        name: 'Default Theme',
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
        border: '#e0e0e0',
        colors: {
          primary: '#1976d2',
          secondary: '#dc004e',
          background: '#ffffff',
          surface: '#f5f5f5',
          text: '#000000',
          border: '#e0e0e0'
        },
        typography: {
          fontFamily: 'Roboto, sans-serif',
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.5
        },
        spacing: {
          unit: 8,
          borderRadius: 4
        },
        shadows: {
          enabled: true,
          intensity: 1
        }
      };

      const dashboardData = {
        ...newDashboard,
        theme: defaultTheme
      };

      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dashboardData)
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards(prev => [...prev, data.dashboard]);
        setNewDashboard({ name: '', description: '' });
        setOpenDialog(false);
        toast.success('Dashboard created successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create dashboard');
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Error creating dashboard');
    }
  };

  const handleDeleteDashboard = async (dashboardId) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setDashboards(prev => prev.filter(d => d._id !== dashboardId));
        toast.success('Dashboard deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete dashboard');
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Error deleting dashboard');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboards...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Dashboards</Typography>
        <Fab
          color="primary"
          onClick={() => setOpenDialog(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {dashboards.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No dashboards yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first dashboard to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Dashboard
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                      {dashboard.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {(() => {
                        const isOwner = dashboard.owner?._id === user?._id;
                        const isCollaborator = dashboard.collaborators?.some(
                          c => c.user?._id === user?._id
                        );
                        
                        return isOwner ? (
                          <Tooltip title="You own this dashboard">
                            <Chip
                              label="Owner"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : isCollaborator ? (
                          <Tooltip title="You collaborate on this dashboard">
                            <Chip
                              label="Collaborator"
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : null;
                      })()}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {dashboard.description || 'No description'}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={`${dashboard.widgets?.length || 0} widgets`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Created by ${dashboard.owner?.username || 'Unknown'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {formatDate(dashboard.updatedAt)}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/dashboard/${dashboard._id}`)}
                  >
                    Open Dashboard
                  </Button>
                 
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dashboard Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            variant="outlined"
            value={newDashboard.name}
            onChange={(e) => setNewDashboard(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newDashboard.description}
            onChange={(e) => setNewDashboard(prev => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDashboard}
            variant="contained"
            disabled={!newDashboard.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 