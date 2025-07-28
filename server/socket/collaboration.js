const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');

module.exports = (io) => {
  // Store active users and their rooms
  const activeUsers = new Map();
  const userRooms = new Map();
  
  // Store chat messages for each dashboard (in memory for now)
  const dashboardChats = new Map();

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join dashboard room
    socket.on('join-dashboard', async (data) => {
      try {
        const { dashboardId } = data;

        // Allow access to ANY dashboard (public system)
        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          isActive: true
        });

        if (!dashboard) {
          socket.emit('error', { message: 'Dashboard not found' });
          return;
        }

        // Leave previous room if any
        if (userRooms.has(socket.user._id)) {
          socket.leave(userRooms.get(socket.user._id));
        }

        // Join new room
        socket.join(dashboardId);
        userRooms.set(socket.user._id, dashboardId);

        // Add to active users
        activeUsers.set(socket.user._id, {
          id: socket.user._id,
          username: socket.user.username,
          email: socket.user.email,
          avatar: socket.user.avatar,
          dashboardId,
          lastSeen: new Date(),
          isOnline: true
        });

        // Initialize chat for dashboard if not exists
        if (!dashboardChats.has(dashboardId)) {
          dashboardChats.set(dashboardId, []);
        }

        // Send existing chat messages to the new user
        const existingMessages = dashboardChats.get(dashboardId) || [];
        console.log(`Sending ${existingMessages.length} chat messages to ${socket.user.username} for dashboard ${dashboardId}`);
        socket.emit('chat-history', existingMessages);

        // Notify others in the room
        socket.to(dashboardId).emit('user-joined', {
          user: {
            id: socket.user._id,
            username: socket.user.username,
            email: socket.user.email,
            avatar: socket.user.avatar
          },
          timestamp: new Date()
        });

        // Send current active users to the new user
        const roomUsers = Array.from(activeUsers.values())
          .filter(user => user.dashboardId === dashboardId);
        
        socket.emit('active-users', roomUsers);

        console.log(`${socket.user.username} joined dashboard ${dashboardId}`);
      } catch (error) {
        console.error('Join dashboard error:', error);
        socket.emit('error', { message: 'Failed to join dashboard' });
      }
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      try {
        const { dashboardId, message } = data;
        
        console.log(`Chat message received from ${socket.user.username}:`, { dashboardId, message });
        
        if (!message || !message.trim()) {
          console.log('Empty message, ignoring');
          return;
        }

        const chatMessage = {
          id: Date.now() + Math.random(), // Simple unique ID
          user: {
            id: socket.user._id,
            name: socket.user.username,
            avatar: socket.user.avatar || ''
          },
          message: message.trim(),
          timestamp: new Date()
        };

        console.log('Created chat message:', chatMessage);

        // Store message in dashboard chat
        if (!dashboardChats.has(dashboardId)) {
          dashboardChats.set(dashboardId, []);
          console.log(`Created new chat for dashboard ${dashboardId}`);
        }
        
        const dashboardChat = dashboardChats.get(dashboardId);
        dashboardChat.push(chatMessage);
        
        console.log(`Dashboard ${dashboardId} now has ${dashboardChat.length} messages`);
        
        // Keep only last 100 messages to prevent memory issues
        if (dashboardChat.length > 100) {
          dashboardChat.splice(0, dashboardChat.length - 100);
          console.log('Trimmed chat to 100 messages');
        }

        // Broadcast to all users in the dashboard room
        console.log(`Broadcasting message to dashboard ${dashboardId}`);
        io.to(dashboardId).emit('new-chat-message', chatMessage);

        console.log(`Chat message from ${socket.user.username} in dashboard ${dashboardId} - broadcasted successfully`);
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle widget updates
    socket.on('widget-update', async (data) => {
      try {
        const { dashboardId, widgetId, updates } = data;

        // Allow ANY user to edit ANY dashboard (public system)
        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          isActive: true
        });

        if (!dashboard) {
          socket.emit('error', { message: 'Dashboard not found' });
          return;
        }

        // Broadcast to other users in the room
        socket.to(dashboardId).emit('widget-updated', {
          widgetId,
          updates,
          user: {
            id: socket.user._id,
            username: socket.user.username
          },
          timestamp: new Date()
        });

        console.log(`Widget ${widgetId} updated by ${socket.user.username}`);
      } catch (error) {
        console.error('Widget update error:', error);
        socket.emit('error', { message: 'Failed to update widget' });
      }
    });

    // Handle dashboard layout changes
    socket.on('layout-update', async (data) => {
      try {
        const { dashboardId, layout } = data;

        // Allow ANY user to edit ANY dashboard (public system)
        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          isActive: true
        });

        if (!dashboard) {
          socket.emit('error', { message: 'Dashboard not found' });
          return;
        }

        // Broadcast to other users in the room
        socket.to(dashboardId).emit('layout-updated', {
          layout,
          user: {
            id: socket.user._id,
            username: socket.user.username
          },
          timestamp: new Date()
        });

        console.log(`Layout updated by ${socket.user.username}`);
      } catch (error) {
        console.error('Layout update error:', error);
        socket.emit('error', { message: 'Failed to update layout' });
      }
    });

    // Handle user typing indicator
    socket.on('typing', (data) => {
      const { dashboardId, isTyping } = data;
      
      socket.to(dashboardId).emit('user-typing', {
        user: {
          id: socket.user._id,
          username: socket.user.username
        },
        isTyping,
        timestamp: new Date()
      });
    });

    // Handle cursor position for collaborative editing
    socket.on('cursor-move', (data) => {
      const { dashboardId, position } = data;
      
      socket.to(dashboardId).emit('cursor-moved', {
        user: {
          id: socket.user._id,
          username: socket.user.username
        },
        position,
        timestamp: new Date()
      });
    });

    // Handle user presence updates
    socket.on('presence-update', (data) => {
      const { dashboardId, status } = data;
      
      const user = activeUsers.get(socket.user._id);
      if (user) {
        user.status = status;
        user.lastSeen = new Date();
        activeUsers.set(socket.user._id, user);
      }

      socket.to(dashboardId).emit('presence-updated', {
        user: {
          id: socket.user._id,
          username: socket.user.username
        },
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);

      // Remove from active users
      activeUsers.delete(socket.user._id);

      // Notify others in the room
      const dashboardId = userRooms.get(socket.user._id);
      if (dashboardId) {
        socket.to(dashboardId).emit('user-left', {
          user: {
            id: socket.user._id,
            username: socket.user.username
          },
          timestamp: new Date()
        });

        userRooms.delete(socket.user._id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Return functions for external use
  return {
    getActiveUsers: () => Array.from(activeUsers.values()),
    getUserRooms: () => Array.from(userRooms.entries()),
    getDashboardChat: (dashboardId) => dashboardChats.get(dashboardId) || [],
    broadcastToDashboard: (dashboardId, event, data) => {
      io.to(dashboardId).emit(event, data);
    }
  };
}; 