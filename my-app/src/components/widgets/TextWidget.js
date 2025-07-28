import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

const TextWidget = ({ widget, onUpdate }) => {
  const content = widget.config?.content || 'Enter your text here...';
  const fontSize = widget.config?.fontSize || 16;
  const fontWeight = widget.config?.fontWeight || 'normal';
  const color = widget.config?.color || '#000000';

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        p: 2,
        overflow: 'auto',
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          color: color,
          lineHeight: 1.5,
          width: '100%',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </Typography>
    </Box>
  );
};

export default TextWidget; 