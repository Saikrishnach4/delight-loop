import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Profile
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{user?.username}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Profile management features coming in the next step!
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 