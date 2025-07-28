import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Widget from './Widget';
import WidgetSelector from './WidgetSelector';
import { useDashboard } from '../context/DashboardContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardCanvas = ({ dashboard, onUpdateDashboard }) => {
  const [layout, setLayout] = useState([]);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [cursorPositions, setCursorPositions] = useState({});
  const { updateWidget, addWidget, removeWidget, socket, activeUsers } = useDashboard();

  // Convert dashboard widgets to grid layout format
  useEffect(() => {
    if (dashboard?.widgets) {
      const gridLayout = dashboard.widgets.map(widget => ({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: 2,
        minH: 2,
        maxW: 12,
        maxH: 8,
      }));
      setLayout(gridLayout);
    }
  }, [dashboard?.widgets]);

  // Handle cursor movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (socket) {
        socket.emit('cursor-move', {
          dashboardId: dashboard?._id,
          position: { x: e.clientX, y: e.clientY }
        });
      }
    };

    const canvas = document.querySelector('.react-grid-layout');
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [socket, dashboard?._id]);

  // Listen for cursor updates from other users
  useEffect(() => {
    if (socket) {
      socket.on('cursor-moved', (data) => {
        setCursorPositions(prev => ({
          ...prev,
          [data.user.id]: {
            position: data.position,
            user: data.user,
            timestamp: data.timestamp
          }
        }));
      });

      return () => {
        socket.off('cursor-moved');
      };
    }
  }, [socket]);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    
    // Update widget positions in dashboard
    const updatedWidgets = dashboard.widgets.map(widget => {
      const layoutItem = newLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }
        };
      }
      return widget;
    });

    onUpdateDashboard({
      ...dashboard,
      widgets: updatedWidgets
    });
  };

  const handleAddWidget = (widgetType) => {
    console.log('Adding widget:', widgetType);
    
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      position: {
        x: 0,
        y: 0,
        w: 6,
        h: 4
      },
      config: getDefaultConfig(widgetType),
      style: {},
      isVisible: true
    };

    console.log('New widget created:', newWidget);

    // Add widget to context
    addWidget(newWidget);
    
    // Update local dashboard state
    const updatedDashboard = {
      ...dashboard,
      widgets: [...(dashboard.widgets || []), newWidget]
    };
    
    console.log('Updated dashboard:', updatedDashboard);
    onUpdateDashboard(updatedDashboard);
    
    setShowWidgetSelector(false);
  };

  const handleWidgetSelect = (widget) => {
    setSelectedWidget(widget);
  };

  const handleWidgetUpdate = (widgetId, updates) => {
    updateWidget(widgetId, updates);
  };

  const handleWidgetDelete = (widgetId) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      removeWidget(widgetId);
    }
  };

  const getDefaultConfig = (widgetType) => {
    const configs = {
      chart: {
        chartType: 'line',
        title: 'New Chart',
        dataSource: 'sample-data',
        colors: ['#1976d2', '#dc004e', '#388e3c']
      },
      table: {
        title: 'New Table',
        columns: ['Name', 'Value', 'Status'],
        dataSource: 'sample-data'
      },
      metric: {
        title: 'New Metric',
        value: '0',
        format: 'number',
        color: '#1976d2'
      },
      text: {
        content: 'Enter your text here...',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#000000'
      },
      'email-campaign': {
        campaignId: '',
        displayMode: 'overview',
        refreshInterval: 30000
      }
    };
    return configs[widgetType] || {};
  };

  if (!dashboard) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* Dashboard Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1
        }}
      >
        <Typography variant="h6">{dashboard.name}</Typography>
        <Box>
          <Tooltip title="Add Widget">
            <IconButton 
              onClick={() => setShowWidgetSelector(true)}
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dashboard Settings">
            <IconButton color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Dashboard Canvas */}
      <Paper 
        sx={{ 
          p: 2, 
          minHeight: '70vh',
          backgroundColor: '#fafafa',
          position: 'relative'
        }}
      >
        {dashboard.widgets && dashboard.widgets.length > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            containerPadding={[16, 16]}
          >
            {dashboard.widgets.map((widget) => (
              <Box key={widget.id} data-grid={widget.position}>
                <Widget
                  widget={widget}
                  onSelect={() => handleWidgetSelect(widget)}
                  onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
                  onDelete={() => handleWidgetDelete(widget.id)}
                  isSelected={selectedWidget?.id === widget.id}
                />
              </Box>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
            textAlign="center"
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No widgets yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add your first widget to start building your dashboard
            </Typography>
            <IconButton
              onClick={() => setShowWidgetSelector(true)}
              color="primary"
              size="large"
              sx={{ 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        )}

        {/* Cursor Indicators */}
        {Object.entries(cursorPositions).map(([userId, cursorData]) => {
          const isRecent = Date.now() - cursorData.timestamp < 5000; // Show for 5 seconds
          if (!isRecent) return null;

          return (
            <Box
              key={userId}
              sx={{
                position: 'absolute',
                left: cursorData.position.x,
                top: cursorData.position.y,
                pointerEvents: 'none',
                zIndex: 1000,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  mt: 0.5,
                }}
              >
                {cursorData.user.username}
              </Typography>
            </Box>
          );
        })}
      </Paper>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <WidgetSelector
          open={showWidgetSelector}
          onClose={() => setShowWidgetSelector(false)}
          onSelectWidget={handleAddWidget}
        />
      )}
    </Box>
  );
};

export default DashboardCanvas; 