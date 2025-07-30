import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  BarChart as ChartIcon,
  TableChart as TableIcon,
  TrendingUp as MetricIcon,
  TextFields as TextIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import apiClient from '../services/axiosConfig';

const WidgetSelector = ({ open, onClose, onSelectWidget }) => {
  const [widgetTypes, setWidgetTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedWidget, setDraggedWidget] = useState(null);

  useEffect(() => {
    fetchWidgetTypes();
  }, []);

  const fetchWidgetTypes = async () => {
    try {
      const response = await apiClient.get('/api/widgets/types');
      setWidgetTypes(response.data.widgetTypes);
    } catch (error) {
      console.error('Error fetching widget types:', error);
      // Fallback to default widget types
      setWidgetTypes(getDefaultWidgetTypes());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultWidgetTypes = () => [
    {
      type: 'chart',
      name: 'Chart',
      description: 'Display data in various chart formats',
      icon: '📊',
      category: 'Data Visualization'
    },
    {
      type: 'table',
      name: 'Table',
      description: 'Display data in tabular format',
      icon: '📋',
      category: 'Data Display'
    },
    {
      type: 'metric',
      name: 'Metric',
      description: 'Display key performance indicators',
      icon: '📈',
      category: 'KPIs'
    },
    {
      type: 'text',
      name: 'Text',
      description: 'Display formatted text content',
      icon: '📝',
      category: 'Content'
    },
    {
      type: 'image',
      name: 'Image',
      description: 'Display images or graphics',
      icon: '🖼️',
      category: 'Media'
    },
    {
      type: 'email-campaign',
      name: 'Email Campaign',
      description: 'Email campaign management widget',
      icon: '📧',
      category: 'Marketing'
    }
  ];

  const getWidgetIcon = (type) => {
    const icons = {
      chart: <ChartIcon sx={{ fontSize: 32 }} />,
      table: <TableIcon sx={{ fontSize: 32 }} />,
      metric: <MetricIcon sx={{ fontSize: 32 }} />,
      text: <TextIcon sx={{ fontSize: 32 }} />,
      'email-campaign': <EmailIcon sx={{ fontSize: 32 }} />,
    };
    return icons[type] || <ChartIcon sx={{ fontSize: 32 }} />;
  };

  const filteredWidgetTypes = widgetTypes.filter(widget =>
    widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    widget.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    widget.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWidgetSelect = (widgetType) => {
    console.log('Widget selected:', widgetType);
    onSelectWidget(widgetType.type);
    onClose();
  };

  // Drag and Drop handlers
  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const groupedWidgets = filteredWidgetTypes.reduce((groups, widget) => {
    const category = widget.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(widget);
    return groups;
  }, {});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Widget</Typography>
          <TextField
            size="small"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Loading widgets...</Typography>
          </Box>
        ) : (
          <Box>
            {Object.entries(groupedWidgets).map(([category, widgets]) => (
              <Box key={category} mb={3}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
                  {category}
                </Typography>
                <Grid container spacing={2}>
                  {widgets.map((widget) => (
                    <Grid item xs={12} sm={6} md={4} key={widget.type}>
                      <Card
                        draggable
                        onDragStart={(e) => handleDragStart(e, widget)}
                        onDragEnd={handleDragEnd}
                        sx={{
                          cursor: 'grab',
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          transform: draggedWidget?.type === widget.type ? 'scale(0.95)' : 'scale(1)',
                          opacity: draggedWidget?.type === widget.type ? 0.7 : 1,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3,
                            border: '1px solid #1976d2',
                          },
                          '&:active': {
                            cursor: 'grabbing',
                          },
                        }}
                        onClick={() => handleWidgetSelect(widget)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 2, position: 'relative' }}>
                          {/* Drag Indicator */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              color: 'text.secondary',
                              opacity: 0.6,
                            }}
                          >
                            <DragIcon fontSize="small" />
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            {getWidgetIcon(widget.type)}
                          </Box>
                          <Typography variant="h6" gutterBottom>
                            {widget.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {widget.description}
                          </Typography>
                          <Chip
                            label={widget.category}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          
                          {/* Drag Instructions */}
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              display: 'block', 
                              mt: 1,
                              fontStyle: 'italic'
                            }}
                          >
                            Drag to canvas or click to add
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
            
            {filteredWidgetTypes.length === 0 && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="text.secondary">
                  No widgets found matching "{searchTerm}"
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WidgetSelector; 