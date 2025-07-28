import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dataService from '../../services/dataService';

const ChartWidget = ({ widget, onUpdate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [widget.config?.dataSource, widget.config?.chartType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dataSource = widget.config?.dataSource || 'sales';
      const chartData = await dataService.getChartData(dataSource);
      setData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };



  const handleChartTypeChange = (event) => {
    onUpdate({
      config: {
        ...widget.config,
        chartType: event.target.value,
      },
    });
  };

  const renderChart = () => {
    const { chartType = 'line' } = widget.config || {};
    const colors = widget.config?.colors || ['#1976d2', '#dc004e', '#388e3c'];

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="value2"
                stroke={colors[1]}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} />
              <Bar dataKey="value2" fill={colors[1]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography color="text.secondary">
              Chart type not supported: {chartType}
            </Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart Controls */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary">
          {widget.config?.title || 'Chart'}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={widget.config?.chartType || 'line'}
            label="Type"
            onChange={handleChartTypeChange}
            size="small"
          >
            <MenuItem value="line">Line</MenuItem>
            <MenuItem value="bar">Bar</MenuItem>
            <MenuItem value="pie">Pie</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {renderChart()}
      </Box>
    </Box>
  );
};

export default ChartWidget; 