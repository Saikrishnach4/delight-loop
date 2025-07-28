import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Image as ImageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const ImageWidget = ({ widget, onUpdate }) => {
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = widget.config?.src || '';
  const altText = widget.config?.alt || 'Image';
  const width = widget.config?.width || '100%';
  const height = widget.config?.height || 'auto';

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  if (imageError || !imageUrl) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          border: '2px dashed #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        <ImageIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {imageUrl ? 'Failed to load image' : 'No image configured'}
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Click to configure image settings
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img
        src={imageUrl}
        alt={altText}
        style={{
          width: width,
          height: height,
          objectFit: 'cover',
          borderRadius: '4px',
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      {widget.config?.showCaption && (
        <Box sx={{ p: 1, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
          <Typography variant="caption">{altText}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ImageWidget; 