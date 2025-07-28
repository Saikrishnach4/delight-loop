import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import dataService from '../../services/dataService';

const MetricWidget = ({ widget, onUpdate }) => {
  const [value, setValue] = useState(0);
  const [trend, setTrend] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [widget.config?.dataSource]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dataSource = widget.config?.dataSource || 'totalRevenue';
      const metricValue = await dataService.getMetric(dataSource);
      setValue(metricValue);
      // Generate random trend for demo
      setTrend((Math.random() - 0.5) * 20);
    } catch (error) {
      console.error('Error loading metric data:', error);
      setValue(0);
      setTrend(0);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (val, format = 'number') => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = (trendValue) => {
    if (trendValue > 0) return 'success';
    if (trendValue < 0) return 'error';
    return 'default';
  };

  const getTrendIcon = (trendValue) => {
    if (trendValue > 0) return <TrendingUpIcon />;
    if (trendValue < 0) return <TrendingDownIcon />;
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        p: 2,
      }}
    >
      <Typography
        variant="h3"
        component="div"
        sx={{
          fontWeight: 'bold',
          color: widget.config?.color || '#1976d2',
          mb: 1,
        }}
      >
        {formatValue(value, widget.config?.format)}
      </Typography>
      
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        {widget.config?.title || 'Metric'}
      </Typography>
      
      {trend !== 0 && (
        <Chip
          icon={getTrendIcon(trend)}
          label={`${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
          color={getTrendColor(trend)}
          variant="outlined"
          size="small"
        />
      )}
    </Box>
  );
};

export default MetricWidget; 