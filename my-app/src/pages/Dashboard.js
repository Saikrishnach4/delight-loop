import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: '',
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      console.log('=== FETCHING DASHBOARDS ===');
      console.log('Making API call to: /api/dashboards');
      console.log('Current user token available:', !!localStorage.getItem('token'));
      console.log('Current user object:', user);
      console.log('Current user ID:', user?.id);
      
      const response = await axios.get('/api/dashboards');
      console.log('API response received:', response);
      console.log('Response status:', response.status);
      console.log('Dashboards data:', response.data);
      console.log('Number of dashboards:', response.data.dashboards?.length || 0);
      
      // Debug dashboard ownership
      if (response.data.dashboards) {
        response.data.dashboards.forEach((dashboard, index) => {
          console.log(`Dashboard ${index + 1}:`, {
            name: dashboard.name,
            owner: dashboard.owner,
            ownerType: typeof dashboard.owner,
            ownerId: dashboard.owner?._id || dashboard.owner,
            currentUser: user?.id,
            currentUserType: typeof user?.id,
            isOwner: (dashboard.owner?._id || dashboard.owner) === user?.id
          });
        });
      }
      
      setDashboards(response.data.dashboards || []);
      console.log('=== DASHBOARDS FETCHED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== DASHBOARDS FETCH ERROR ===');
      console.error('Error fetching dashboards:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error details:', error.response?.data);
      console.error('Error config:', error.config);
      
      toast.error('Failed to load dashboards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      const response = await axios.post('/api/dashboards', newDashboard);
      setDashboards(prev => [response.data.dashboard, ...prev]);
      setOpenDialog(false);
      setNewDashboard({ name: '', description: '' });
      toast.success('Dashboard created successfully!');
      navigate(`/dashboard/${response.data.dashboard._id}`);
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
    }
  };

  const handleDeleteDashboard = async (dashboardId) => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await axios.delete(`/api/dashboards/${dashboardId}`);
        setDashboards(prev => prev.filter(d => d._id !== dashboardId));
        toast.success('Dashboard deleted successfully!');
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        toast.error('Failed to delete dashboard');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboards...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Dashboards
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Dashboard
        </Button>
      </Box>

      {dashboards.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <DashboardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No dashboards yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create the first dashboard to start collaborating with others
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create First Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2" noWrap>
                      {dashboard.name}
                    </Typography>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/dashboard/${dashboard._id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {/* Only show delete button for dashboard owner */}
                      {(() => {
                        const isOwner = (dashboard.owner?._id || dashboard.owner) === user?.id;
                        console.log(`Delete button check for "${dashboard.name}":`, {
                          dashboardOwner: dashboard.owner,
                          dashboardOwnerId: dashboard.owner?._id || dashboard.owner,
                          currentUser: user?.id,
                          isOwner: isOwner
                        });
                        return isOwner ? (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteDashboard(dashboard._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
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
                      icon={<GroupIcon />}
                      label={`${dashboard.collaborators?.length || 0} collaborators`}
                      size="small"
                      variant="outlined"
                    />
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
                  <Button
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      // TODO: Implement share functionality
                      toast.info('Share functionality coming soon!');
                    }}
                  >
                    Share
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