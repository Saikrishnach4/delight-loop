import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardCanvas from '../components/DashboardCanvas';
import { useDashboard } from '../context/DashboardContext';

const DashboardBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setCurrentDashboard } = useDashboard();

  useEffect(() => {
    console.log('DashboardBuilder useEffect triggered with id:', id);
    console.log('Current URL params:', window.location.pathname);
    console.log('Dashboard ID from URL:', id);
    fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    try {
      console.log('=== FETCHING DASHBOARD ===');
      console.log('Fetching dashboard with ID:', id);
      console.log('Making API call to:', `/api/dashboards/${id}`);
      console.log('Current user token available:', !!localStorage.getItem('token'));
      
      const response = await axios.get(`/api/dashboards/${id}`);
      console.log('API response received:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      const dashboardData = response.data.dashboard;
      console.log('Dashboard data received:', dashboardData);
      console.log('Dashboard ID:', dashboardData._id);
      console.log('Dashboard name:', dashboardData.name);
      
      setDashboard(dashboardData);
      console.log('Calling setCurrentDashboard with:', dashboardData);
      setCurrentDashboard(dashboardData);
      console.log('=== DASHBOARD FETCHED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== DASHBOARD FETCH ERROR ===');
      console.error('Error fetching dashboard:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error details:', error.response?.data);
      console.error('Error config:', error.config);
      
      // Create a test dashboard for debugging
      console.log('Creating test dashboard for debugging...');
      const testDashboard = {
        _id: 'test-dashboard-' + Date.now(),
        name: 'Test Dashboard',
        description: 'Test dashboard for debugging',
        widgets: [],
        layout: [],
        owner: 'test-user',
        isActive: true
      };
      
      console.log('Setting test dashboard:', testDashboard);
      setDashboard(testDashboard);
      setCurrentDashboard(testDashboard);
      
      // Don't navigate away, just show error
      toast.error('Failed to load dashboard, using test dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDashboard = async (updatedDashboard) => {
    console.log('Dashboard updated:', updatedDashboard);
    setDashboard(updatedDashboard);
    
    // Auto-save functionality
    try {
      await axios.put(`/api/dashboards/${id}`, updatedDashboard);
      // Don't show toast for auto-save to avoid spam
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/api/dashboards/${id}`, dashboard);
      toast.success('Dashboard saved successfully!');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Dashboard not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Back to Dashboards">
            <IconButton onClick={handleBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" component="h1">
              {dashboard.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboard.description || 'No description'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Dashboard Settings">
            <IconButton color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Dashboard Canvas */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <DashboardCanvas
          dashboard={dashboard}
          onUpdateDashboard={handleUpdateDashboard}
        />
      </Box>

      {/* Auto-save indicator */}
      <Snackbar
        open={false} // This would be controlled by auto-save state
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          Auto-saved
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardBuilder; 