import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

// Widget Type Components
import ChartWidget from './widgets/ChartWidget';
import TableWidget from './widgets/TableWidget';
import MetricWidget from './widgets/MetricWidget';
import TextWidget from './widgets/TextWidget';
import EmailCampaignWidget from './widgets/EmailCampaignWidget';
import ImageWidget from './widgets/ImageWidget';
import WidgetConfigModal from './WidgetConfigModal';

const Widget = ({ widget, theme, onSelect, onUpdate, onDelete, isSelected }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleMenuOpen = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setShowConfig(true);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete();
  };

  const handleDuplicate = () => {
    handleMenuClose();
    const duplicatedWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      config: { ...widget.config, title: `${widget.config.title} (Copy)` }
    };
    // This would need to be handled by the parent component
  };

  const handleConfigUpdate = (updates) => {
    onUpdate(updates);
    setShowConfig(false);
  };

  const handleCardClick = (event) => {
    // Don't trigger selection if clicking on the menu button
    if (event.target.closest('[data-menu-button]')) {
      return;
    }
    onSelect();
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} onUpdate={onUpdate} />;
      case 'table':
        return <TableWidget widget={widget} onUpdate={onUpdate} />;
      case 'metric':
        return <MetricWidget widget={widget} onUpdate={onUpdate} />;
      case 'text':
        return <TextWidget widget={widget} onUpdate={onUpdate} />;
      case 'email-campaign':
        return <EmailCampaignWidget widget={widget} onUpdate={onUpdate} />;
      case 'image':
        return <ImageWidget widget={widget} onUpdate={onUpdate} />;
      default:
        return (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography color="text.secondary">
              Unknown widget type: {widget.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: isSelected 
          ? `2px solid ${theme?.primary || '#1976d2'}` 
          : `1px solid ${theme?.border || '#e0e0e0'}`,
        borderRadius: theme?.spacing?.borderRadius || 4,
        backgroundColor: theme?.background || '#ffffff',
        color: theme?.text || '#000000',
        fontFamily: theme?.typography?.fontFamily || 'inherit',
        fontSize: theme?.typography?.fontSize || 14,
        fontWeight: theme?.typography?.fontWeight || 400,
        lineHeight: theme?.typography?.lineHeight || 1.5,
        '&:hover': {
          boxShadow: theme?.shadows?.enabled ? `${theme?.shadows?.intensity || 1}px 2px 8px rgba(0,0,0,0.1)` : 3,
          border: `1px solid ${theme?.primary || '#1976d2'}`,
        },
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={handleCardClick}
    >
      {/* Widget Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: `1px solid ${theme?.border || '#e0e0e0'}`,
          backgroundColor: theme?.colors?.surface || '#f5f5f5',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: theme?.typography?.fontWeight || 'medium',
            color: theme?.text || '#333',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: theme?.typography?.fontFamily || 'inherit',
            fontSize: theme?.typography?.fontSize || 14,
          }}
        >
          {widget.config?.title || `${widget.type} Widget`}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Widget Options">
            <IconButton
              data-menu-button="true"
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Widget Content */}
      <CardContent
        sx={{
          flex: 1,
          p: theme?.spacing?.unit ? theme.spacing.unit / 8 : 1,
          '&:last-child': { pb: theme?.spacing?.unit ? theme.spacing.unit / 8 : 1 },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme?.background || '#ffffff',
        }}
      >
        {renderWidgetContent()}
      </CardContent>

      {/* Widget Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Widget</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setShowConfig(true);
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Widget Configuration Modal */}
      {showConfig && (
        <WidgetConfigModal
          widget={widget}
          open={showConfig}
          onClose={() => setShowConfig(false)}
          onUpdate={handleConfigUpdate}
        />
      )}
    </Card>
  );
};

export default Widget; 