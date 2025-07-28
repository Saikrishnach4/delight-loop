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

  // Handle drag and drop from widget selector
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    try {
      const widgetData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Calculate drop position relative to canvas
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - canvasRect.left;
      const dropY = e.clientY - canvasRect.top;
      
      // Convert to grid coordinates (approximate)
      const gridX = Math.floor((dropX / canvasRect.width) * 12);
      const gridY = Math.floor((dropY / 60)); // Assuming 60px row height
      
      handleAddWidget(widgetData.type, { x: gridX, y: gridY });
    } catch (error) {
      console.error('Error parsing dropped widget data:', error);
    }
  };

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

  const handleAddWidget = (widgetType, position = null) => {
    
    const defaultPosition = position || { x: 0, y: 0, w: 6, h: 4 };
    
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      position: defaultPosition,
      config: getDefaultConfig(widgetType),
      style: {},
      isVisible: true
    };

    // Add widget to context
    addWidget(newWidget);
    
    // Update local dashboard state
    const updatedDashboard = {
      ...dashboard,
      widgets: [...(dashboard.widgets || []), newWidget]
    };
    
    onUpdateDashboard(updatedDashboard);
    
    setShowWidgetSelector(false);
  };

  const handleWidgetSelect = (widget) => {
    setSelectedWidget(widget);
  };

  const handleWidgetUpdate = (widgetId, updates) => {
    updateWidget(widgetId, updates);
    
    // Also update the local dashboard state
    const updatedWidgets = dashboard.widgets.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    
    onUpdateDashboard({
      ...dashboard,
      widgets: updatedWidgets
    });
  };

  const handleWidgetDelete = (widgetId) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      removeWidget(widgetId);
      
      // Also update the local dashboard state
      const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);
      onUpdateDashboard({
        ...dashboard,
        widgets: updatedWidgets
      });
    }
  };

  const getDefaultConfig = (widgetType) => {
    const configs = {
      chart: {
        title: 'New Chart',
        chartType: 'line',
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
        title: 'New Text Widget',
        content: 'Enter your text here...',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#000000'
      },
      image: {
        title: 'New Image',
        imageUrl: 'https://via.placeholder.com/300x200',
        altText: 'Sample image',
        caption: 'Image caption'
      },
      'email-campaign': {
        title: 'Email Campaign',
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
    <Box 
      sx={{ 
        height: '100%',
        backgroundColor: dashboard.theme?.background || '#f5f5f5',
        color: dashboard.theme?.text || '#000000',
        fontFamily: dashboard.theme?.typography?.fontFamily || 'inherit',
        fontSize: dashboard.theme?.typography?.fontSize || 14,
        fontWeight: dashboard.theme?.typography?.fontWeight || 400,
        lineHeight: dashboard.theme?.typography?.lineHeight || 1.5,
      }}
    >
      {/* Dashboard Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          p: 2,
          backgroundColor: dashboard.theme?.colors?.surface || 'background.paper',
          borderRadius: dashboard.theme?.spacing?.borderRadius || 1,
          border: `1px solid ${dashboard.theme?.border || '#e0e0e0'}`,
          boxShadow: dashboard.theme?.shadows?.enabled ? `${dashboard.theme?.shadows?.intensity || 1}px 2px 4px rgba(0,0,0,0.1)` : 1,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: dashboard.theme?.text || 'inherit',
            fontFamily: dashboard.theme?.typography?.fontFamily || 'inherit',
            fontSize: dashboard.theme?.typography?.fontSize ? dashboard.theme.typography.fontSize * 1.25 : 'inherit',
            fontWeight: dashboard.theme?.typography?.fontWeight || 'bold',
          }}
        >
          {dashboard.name}
        </Typography>
        <Box>
          <Tooltip title="Add Widget">
            <IconButton 
              onClick={() => setShowWidgetSelector(true)}
              color="primary"
              sx={{ color: dashboard.theme?.primary || '#1976d2' }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dashboard Settings">
            <IconButton 
              color="primary"
              sx={{ color: dashboard.theme?.primary || '#1976d2' }}
            >
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
          backgroundColor: dashboard.theme?.background || '#fafafa',
          position: 'relative',
          border: `1px solid ${dashboard.theme?.border || '#e0e0e0'}`,
          borderRadius: dashboard.theme?.spacing?.borderRadius || 4,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
                  theme={dashboard.theme}
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
            <Typography 
              variant="h6" 
              sx={{ 
                color: dashboard.theme?.text || 'text.secondary',
                fontFamily: dashboard.theme?.typography?.fontFamily || 'inherit',
                fontSize: dashboard.theme?.typography?.fontSize ? dashboard.theme.typography.fontSize * 1.5 : 'inherit',
                fontWeight: dashboard.theme?.typography?.fontWeight || 'bold',
                mb: 2,
              }}
              gutterBottom
            >
              No widgets yet
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: dashboard.theme?.text || 'text.secondary',
                fontFamily: dashboard.theme?.typography?.fontFamily || 'inherit',
                fontSize: dashboard.theme?.typography?.fontSize || 14,
                mb: 3,
              }}
            >
              Drag widgets from the selector or click the + button to start building your dashboard
            </Typography>
            <IconButton
              onClick={() => setShowWidgetSelector(true)}
              color="primary"
              size="large"
              sx={{ 
                backgroundColor: dashboard.theme?.primary || 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: dashboard.theme?.colors?.primaryDark || 'primary.dark',
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