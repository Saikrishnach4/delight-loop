import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  TextField,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';

const CollaborationPanel = () => {
  const { activeUsers, currentUser, socket, currentDashboard, chatMessages } = useDashboard();
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newMessage, setNewMessage] = useState('');

  const getUserStatus = (user) => {
    if (user.isEditing) return 'editing';
    if (user.isViewing) return 'viewing';
    return 'idle';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'editing':
        return 'success';
      case 'viewing':
        return 'info';
      case 'idle':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'editing':
        return <EditIcon fontSize="small" />;
      case 'viewing':
        return <VisibilityIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket && currentDashboard?._id) {
      console.log('Sending chat message:', {
        dashboardId: currentDashboard._id,
        message: newMessage.trim(),
        socketConnected: socket.connected
      });
      
      // Send message through socket
      socket.emit('chat-message', {
        dashboardId: currentDashboard._id,
        message: newMessage.trim()
      });
      
      setNewMessage('');
    } else {
      console.log('Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        hasSocket: !!socket,
        hasDashboard: !!currentDashboard?._id,
        socketConnected: socket?.connected
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Collaboration</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            size="small" 
            label={socket?.connected ? 'Connected' : 'Disconnected'} 
            color={socket?.connected ? 'success' : 'error'} 
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={`${activeUsers.length} users`}
            color="info"
            variant="outlined"
          />
          <Tooltip title="Toggle Chat">
            <IconButton size="small" onClick={() => setShowChat(!showChat)}>
              <ChatIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Debug Information */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '12px' }}>
        <div>Socket: {socket ? 'Yes' : 'No'}</div>
        <div>Socket Connected: {socket?.connected ? 'Yes' : 'No'}</div>
        <div>Current Dashboard: {currentDashboard?._id || 'None'}</div>
        <div>Chat Messages: {chatMessages.length}</div>
        <div>Active Users: {activeUsers.length}</div>
        <div>Current User: {currentUser?.name || 'None'}</div>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Users" />
        <Tab label="Chat" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <List sx={{ p: 0 }}>
            {activeUsers.map((user, index) => {
              const status = getUserStatus(user);
              const isCurrentUser = user.id === currentUser?.id;
              
              return (
                <React.Fragment key={user.id}>
                  <ListItem
                    sx={{
                      backgroundColor: isCurrentUser ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: user.color || '#1976d2',
                              border: '2px solid white',
                            }}
                          />
                        }
                      >
                        <Avatar sx={{ bgcolor: user.color || '#1976d2' }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name}
                            {isCurrentUser && ' (You)'}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(status)}
                            label={status}
                            size="small"
                            color={getStatusColor(status)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {user.lastActivity || 'Recently active'}
                        </Typography>
                      }
                    />
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                  {index < activeUsers.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>

          {activeUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No active collaborators
              </Typography>
            </Box>
          )}

          {/* Collaboration Stats */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">
              {activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </>
      )}

      {activeTab === 1 && (
        <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            {chatMessages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              chatMessages.map((message) => (
                <Box key={message.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {message.user.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" fontWeight="medium">
                          {message.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                        {message.message}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
              disabled={!socket?.connected || !currentDashboard?._id}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !socket?.connected || !currentDashboard?._id}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default CollaborationPanel; 