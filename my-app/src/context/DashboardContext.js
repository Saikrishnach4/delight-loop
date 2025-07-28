import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

const initialState = {
  currentDashboard: null,
  currentUser: null,
  activeUsers: [],
  chatMessages: [],
  isCollaborating: false,
  socket: null,
  widgetTypes: [],
  isLoading: false,
};

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_DASHBOARD':
      return { ...state, currentDashboard: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.payload };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_COLLABORATING':
      return { ...state, isCollaborating: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_WIDGET_TYPES':
      return { ...state, widgetTypes: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_WIDGET':
      if (!state.currentDashboard) return state;
      return {
        ...state,
        currentDashboard: {
          ...state.currentDashboard,
          widgets: state.currentDashboard.widgets.map(widget =>
            widget.id === action.payload.widgetId
              ? { ...widget, ...action.payload.updates }
              : widget
          ),
        },
      };
    case 'ADD_WIDGET':
      if (!state.currentDashboard) return state;
      return {
        ...state,
        currentDashboard: {
          ...state.currentDashboard,
          widgets: [...state.currentDashboard.widgets, action.payload],
        },
      };
    case 'REMOVE_WIDGET':
      if (!state.currentDashboard) return state;
      return {
        ...state,
        currentDashboard: {
          ...state.currentDashboard,
          widgets: state.currentDashboard.widgets.filter(
            widget => widget.id !== action.payload
          ),
        },
      };
    case 'UPDATE_LAYOUT':
      if (!state.currentDashboard) return state;
      return {
        ...state,
        currentDashboard: {
          ...state.currentDashboard,
          layout: action.payload,
        },
      };
    default:
      return state;
  }
};

export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { token, user } = useAuth();

  // Monitor currentDashboard changes
  useEffect(() => {
    console.log('DashboardContext - currentDashboard changed:', state.currentDashboard);
    console.log('DashboardContext - currentDashboard ID:', state.currentDashboard?._id);
  }, [state.currentDashboard]);

  // Initialize socket connection
  useEffect(() => {
    if (token && !state.socket) {
      console.log('DashboardContext - Initializing socket connection');
      const socket = io('http://localhost:5000', {
        auth: { token },
      });

      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      socket.on('user-joined', (data) => {
        console.log('=== USER JOINED EVENT ===');
        console.log('User joined:', data);
        console.log('Current active users before:', state.activeUsers);
        // Update active users list
        dispatch({ type: 'SET_ACTIVE_USERS', payload: [...state.activeUsers, data.user] });
        console.log('=== USER JOINED HANDLED ===');
      });

      socket.on('user-left', (data) => {
        console.log('=== USER LEFT EVENT ===');
        console.log('User left:', data);
        console.log('Current active users before:', state.activeUsers);
        // Remove user from active users list
        dispatch({ 
          type: 'SET_ACTIVE_USERS', 
          payload: state.activeUsers.filter(u => u.id !== data.user.id) 
        });
        console.log('=== USER LEFT HANDLED ===');
      });

      socket.on('active-users', (users) => {
        console.log('=== ACTIVE USERS EVENT ===');
        console.log('Active users received:', users);
        console.log('Number of users:', users.length);
        dispatch({ type: 'SET_ACTIVE_USERS', payload: users });
        console.log('=== ACTIVE USERS HANDLED ===');
      });

      socket.on('widget-updated', (data) => {
        console.log('Widget updated:', data);
        // Handle real-time widget updates
        dispatch({
          type: 'UPDATE_WIDGET',
          payload: { widgetId: data.widgetId, updates: data.updates },
        });
      });

      socket.on('layout-updated', (data) => {
        console.log('Layout updated:', data);
        // Handle real-time layout updates
        dispatch({ type: 'UPDATE_LAYOUT', payload: data.layout });
      });

      socket.on('cursor-moved', (data) => {
        // Handle cursor movement updates
        console.log('Cursor moved:', data);
      });

      // Chat event listeners
      socket.on('chat-history', (messages) => {
        console.log('Chat history received:', messages);
        // Store chat messages in context state
        dispatch({ type: 'SET_CHAT_MESSAGES', payload: messages });
      });

      socket.on('new-chat-message', (message) => {
        console.log('New chat message received:', message);
        // Add new message to existing messages
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      dispatch({ type: 'SET_SOCKET', payload: socket });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const joinDashboard = (dashboardId) => {
    console.log('=== JOINING DASHBOARD ===');
    console.log('joinDashboard called with:', dashboardId);
    console.log('Socket available:', !!state.socket);
    console.log('Socket connected:', state.socket?.connected);
    console.log('Current user:', state.currentUser);
    
    if (state.socket) {
      console.log('Emitting join-dashboard event');
      state.socket.emit('join-dashboard', { dashboardId });
      dispatch({ type: 'SET_COLLABORATING', payload: true });
      console.log('=== DASHBOARD JOIN REQUESTED ===');
    } else {
      console.log('No socket available for joining dashboard');
    }
  };

  const leaveDashboard = () => {
    if (state.socket) {
      // Socket.IO will handle leaving the room automatically
      dispatch({ type: 'SET_COLLABORATING', payload: false });
      dispatch({ type: 'SET_ACTIVE_USERS', payload: [] });
      dispatch({ type: 'SET_CHAT_MESSAGES', payload: [] });
    }
  };

  const updateWidget = (widgetId, updates) => {
    if (state.socket && state.currentDashboard) {
      state.socket.emit('widget-update', {
        dashboardId: state.currentDashboard._id,
        widgetId,
        updates,
      });
    }
    dispatch({
      type: 'UPDATE_WIDGET',
      payload: { widgetId, updates },
    });
  };

  const addWidget = (widget) => {
    dispatch({ type: 'ADD_WIDGET', payload: widget });
  };

  const removeWidget = (widgetId) => {
    dispatch({ type: 'REMOVE_WIDGET', payload: widgetId });
  };

  const updateLayout = (layout) => {
    if (state.socket && state.currentDashboard) {
      state.socket.emit('layout-update', {
        dashboardId: state.currentDashboard._id,
        layout,
      });
    }
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  };

  const setCurrentDashboard = (dashboard) => {
    console.log('Setting current dashboard:', dashboard);
    dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: dashboard });
    // Set current user from auth context
    if (user) {
      console.log('Setting current user:', user);
      dispatch({ 
        type: 'SET_CURRENT_USER', 
        payload: {
          id: user._id,
          name: user.username,
          email: user.email,
          avatar: user.avatar
        }
      });
    }
    if (dashboard) {
      console.log('Joining dashboard:', dashboard._id);
      joinDashboard(dashboard._id);
    } else {
      console.log('Leaving dashboard');
      leaveDashboard();
    }
  };

  const value = {
    currentDashboard: state.currentDashboard,
    currentUser: state.currentUser,
    activeUsers: state.activeUsers,
    chatMessages: state.chatMessages,
    isCollaborating: state.isCollaborating,
    socket: state.socket,
    widgetTypes: state.widgetTypes,
    isLoading: state.isLoading,
    setCurrentDashboard,
    updateWidget,
    addWidget,
    removeWidget,
    updateLayout,
    joinDashboard,
    leaveDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}; 