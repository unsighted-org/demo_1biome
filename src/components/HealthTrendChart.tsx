import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  CardHeader, Typography, useMediaQuery, useTheme, Popover, TextField
} from '@mui/material';
import { useHealth } from '@/services/HealthContext';
import { format } from 'date-fns';
import { FaHeart, FaLungs, FaWind, FaRunning, FaCalendarAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

import { formatDate, getHealthScoreDescription } from '@/lib/helpers';
import { getColorForMetric, getMetricColor } from '@/lib/colorUtils';
import type { HealthEnvironmentData } from '@/types';


type HealthMetric = 'cardioHealthScore' | 'respiratoryHealthScore' | 'physicalActivityScore' | 'environmentalImpactScore';

const isHealthMetric = (key: string): key is HealthMetric => {
  return ['cardioHealthScore', 'respiratoryHealthScore', 'physicalActivityScore', 'environmentalImpactScore'].includes(key);
};

interface HealthTrendChartProps {
  onDataUpdate: (data: HealthEnvironmentData[], selectedMetrics: string[]) => void;
}


const HealthTrendChart = forwardRef(({ onDataUpdate }: HealthTrendChartProps, ref) => {
  const { healthData, fetchHealthData, loading } = useHealth();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const metricOptions = useMemo(() => [
    { value: 'cardioHealthScore', label: 'Cardio Health', icon: <FaHeart /> },
    { value: 'respiratoryHealthScore', label: 'Respiratory Health', icon: <FaLungs /> },
    { value: 'physicalActivityScore', label: 'Physical Activity', icon: <FaRunning /> },
    { value: 'environmentalImpactScore', label: 'Environmental Impact', icon: <FaWind /> },
  ], []);

  useEffect(() => {
    if (healthData.length > 0 && !startDate && !endDate) {
      const firstDate = new Date(healthData[0].timestamp);
      const lastDate = new Date(healthData[healthData.length - 1].timestamp);
      setStartDate(firstDate);
      setEndDate(lastDate);
      setStartDateInput(format(firstDate, 'yyyy-MM-dd'));
      setEndDateInput(format(lastDate, 'yyyy-MM-dd'));
    }
  }, [healthData, startDate, endDate]);

  const toggleMetric = useCallback((metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  }, []);

  const filteredData = useMemo(() => {
    return healthData.filter(data => {
      const dataDate = new Date(data.timestamp);
      return (!startDate || dataDate >= startDate) && (!endDate || dataDate <= endDate);
    });
  }, [healthData, startDate, endDate]);

  useEffect(() => {
    onDataUpdate(filteredData, selectedMetrics);
  }, [filteredData, selectedMetrics, onDataUpdate]);

  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (!loading) {
        await fetchHealthData(1);
      }
    }
  }), [fetchHealthData, loading]);

  const handleDateRangeClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleDateRangeClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDateRangeSubmit = useCallback(() => {
    try {
      const newStartDate = new Date(startDateInput);
      const newEndDate = new Date(endDateInput);
      if (newStartDate > newEndDate) {
        throw new Error('Start date must be before end date');
      }
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      handleDateRangeClose();
    } catch (error) {
      console.error('Error setting date range:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [startDateInput, endDateInput, handleDateRangeClose]);

  const zoom = useCallback(() => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    let [leftTimestamp, rightTimestamp] = [Number(refAreaLeft), Number(refAreaRight)].sort((a, b) => a - b);

    setStartDate(new Date(leftTimestamp));
    setEndDate(new Date(rightTimestamp));
    setRefAreaLeft('');
    setRefAreaRight('');
  }, [refAreaLeft, refAreaRight]);

  const zoomOut = useCallback(() => {
    if (healthData.length > 0) {
      setStartDate(new Date(healthData[0].timestamp));
      setEndDate(new Date(healthData[healthData.length - 1].timestamp));
    }
    setRefAreaLeft('');
    setRefAreaRight('');
  }, [healthData]);

  const getLineColor = useCallback((metric: string): string => {
    const latestData = filteredData[filteredData.length - 1];
    if (latestData && isHealthMetric(metric)) {
      return getColorForMetric(metric, latestData[metric]);
    }
    return getMetricColor(metric);
  }, [filteredData]);

  if (!healthData || healthData.length === 0) {
    return <Typography>No health data available</Typography>;
  }
  
  return (
    <Card className="health-trend-card">
      <CardHeader title={<Typography variant="h6">Health Trends</Typography>} />
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="chart-type-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              onChange={(event) => setChartType(event.target.value as 'line' | 'area')}
              label="Chart Type"
            >
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="area">Area</MenuItem>
            </Select>
          </FormControl>
          <Button
            aria-label="Open date range selector"
            variant="outlined"
            size="small"
            onClick={handleDateRangeClick}
            startIcon={<FaCalendarAlt />}
          >
            Date Range
          </Button>
        </div>
        <div className="flex flex-wrap justify-start items-center mb=4">
          {metricOptions.map(({ value, label, icon }) => (
            <Button
              key={value}
              aria-label={`Toggle ${label} metric`}
              variant={selectedMetrics.includes(value) ? 'contained' : 'outlined'}
              size="small"
              onClick={() => toggleMetric(value)}
              startIcon={icon}
              sx={{ mr: 1, mb: 1 }}
            >
              {isMobile ? '' : label}
            </Button>
          ))}
        </div>
        <div className="chart-container" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel.toString())}
              onMouseMove={(e) => e && refAreaLeft && e.activeLabel && setRefAreaRight(e.activeLabel.toString())}
              onMouseUp={zoom}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => formatDate(new Date(timestamp).toISOString())}
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis tickFormatter={(value) => getHealthScoreDescription(value)} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px' }}
                labelFormatter={(timestamp) => formatDate(new Date(timestamp).toISOString())}
                formatter={(value, name) => [`${value} (${getHealthScoreDescription(Number(value))})`, name]}
              />
              <Legend />
              {selectedMetrics.map((metric) => (
                <Line
                  key={metric}
                  type={chartType === 'area' ? 'monotone' : 'linear'}
                  dataKey={metric}
                  stroke={getLineColor(metric)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  fill={chartType === 'area' ? `${getLineColor(metric)}40` : 'none'}
                />
              ))}
              {refAreaLeft && refAreaRight && (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Button onClick={zoomOut} sx={{ mt: 2 }}>Zoom Out</Button>
      <Popover
        id="date-range-popover"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleDateRangeClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <div className="p-4">
          <TextField
            label="Start Date"
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <Button onClick={handleDateRangeSubmit}>Apply</Button>
        </div>
      </Popover>
      </CardContent>
    </Card>
  );
});

export default HealthTrendChart;
