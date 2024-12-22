import {
  Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  CardHeader, Typography, useMediaQuery, useTheme, Popover, TextField, CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaHeart, FaLungs, FaWind, FaRunning, FaCalendarAlt } from 'react-icons/fa';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

import { getColorForMetric, getMetricColor } from '@/lib/colorUtils';
import { formatDate, getHealthScoreDescription } from '@/lib/helpers';
import { useHealth } from '@/contexts/HealthContext';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { SelectChangeEvent } from '@mui/material';

interface HealthTrendChartProps {
  onDataUpdate: (data: HealthEnvironmentData[], selectedMetrics: HealthMetric[]) => void;
}

export interface HealthTrendChartRef {
  refreshData: () => Promise<void>;
}

const HealthTrendChart = forwardRef<HealthTrendChartRef, HealthTrendChartProps>(({ onDataUpdate }, ref) => {
  const { healthData, fetchHealthData, loading: healthLoading } = useHealth();
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const [chartType, setChartType] = useState<'line' | 'area' | 'correlation'>('line');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const getResponsiveLabel = useCallback((value: number) => {
  const label = getHealthScoreDescription(value);
  if (isMobile) {
    // Use abbreviations on mobile
    return label.substring(0, 1);
  } else if (isTablet) {
    // Use short forms on tablets
    return label.substring(0, 3);
  }
  return label;
}, [isMobile, isTablet]);

const CustomYAxisTick = useCallback(({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
        {getResponsiveLabel(payload.value)}
      </text>
    </g>
  );
}, [getResponsiveLabel]);

    // Calculate responsive font sizes
  const titleFontSize = useMemo(() => {
    if (isMobile) return 'clamp(1rem, 4vw, 1.25rem)';
    if (isTablet) return 'clamp(1.25rem, 3vw, 1.5rem)';
    return 'clamp(1.5rem, 2vw, 2rem)';
  }, [isMobile, isTablet]);

  const buttonFontSize = useMemo(() => {
    if (isMobile) return 'clamp(0.75rem, 3vw, 0.875rem)';
    return 'clamp(0.875rem, 1.5vw, 1rem)';
  }, [isMobile]);

  const metricOptions = useMemo(() => [
    { value: 'cardioHealthScore' as const, label: 'Cardio Health', icon: <FaHeart /> },
    { value: 'respiratoryHealthScore' as const, label: 'Respiratory Health', icon: <FaLungs /> },
    { value: 'physicalActivityScore' as const, label: 'Physical Activity', icon: <FaRunning /> },
    { value: 'environmentalImpactScore' as const, label: 'Environmental Impact', icon: <FaWind /> },
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

  const toggleMetric = useCallback((metric: HealthMetric) => {
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

  const transformedData = useMemo(() => {
    return filteredData.map(data => {
      const transformed: { timestamp: string } & Record<HealthMetric, number> = { timestamp: data.timestamp, cardioHealthScore: 0, respiratoryHealthScore: 0, physicalActivityScore: 0, environmentalImpactScore: 0 };
      selectedMetrics.forEach(metric => {
        transformed[metric] = data[metric];
      });
      return transformed;
    });
  }, [filteredData, selectedMetrics]);

  const [chartKey, setChartKey] = useState(0);
  
  useEffect(() => {
    const handleResize = (): void => {
      // Force a re-render of the chart
      setChartKey(prevKey => prevKey + 1);
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    onDataUpdate(filteredData, selectedMetrics);
  }, [filteredData, selectedMetrics, onDataUpdate]);

  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (!loading && !healthLoading) {
        setLoading(true);
        await fetchHealthData(1);
        setLoading(false);
      }
    }
  }), [fetchHealthData, loading, healthLoading]);

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

    const [leftTimestamp, rightTimestamp] = [Number(refAreaLeft), Number(refAreaRight)].sort((a, b) => a - b);

    setStartDate(new Date(leftTimestamp));
    setEndDate(new Date(rightTimestamp));
    setRefAreaLeft('');
    setRefAreaRight('');

    // Update zoom level in HealthContext
    const zoomLevel = healthData.length / filteredData.length;
    // setZoom(zoomLevel);
  }, [refAreaLeft, refAreaRight, healthData.length, filteredData.length]);

  const zoomOut = useCallback(() => {
    if (healthData.length > 0) {
      setStartDate(new Date(healthData[0].timestamp));
      setEndDate(new Date(healthData[healthData.length - 1].timestamp));
    }
    setRefAreaLeft('');
    setRefAreaRight('');
    // setZoom(1); // Reset zoom level in HealthContext
  }, [healthData]);

  const getLineColor = useCallback((metric: HealthMetric): string => {
    const latestData = filteredData[filteredData.length - 1];
    if (latestData) {
      return getColorForMetric(metric, latestData[metric]);
    }
    return getMetricColor(metric);
  }, [filteredData]);

  const renderChart = useMemo(() => {
  switch (chartType) {
    case 'line':
      return (
        <LineChart
          data={transformedData}
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
          <YAxis 
            tickFormatter={getResponsiveLabel} 
            tick={<CustomYAxisTick />}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px' }}
            labelFormatter={(timestamp) => formatDate(new Date(timestamp).toISOString())}
            formatter={(value, name) => [`${value} (${getHealthScoreDescription(Number(value))})`, name]}
          />
          <Legend />
          {selectedMetrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={getLineColor(metric)}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          ))}
          {refAreaLeft && refAreaRight && (
            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
          )}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart
          data={transformedData}
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
          <YAxis 
            tickFormatter={getResponsiveLabel} 
            tick={<CustomYAxisTick />}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px' }}
            labelFormatter={(timestamp) => formatDate(new Date(timestamp).toISOString())}
            formatter={(value, name) => [`${value} (${getHealthScoreDescription(Number(value))})`, name]}
          />
          <Legend />
          {selectedMetrics.map((metric) => (
            <Area
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={getLineColor(metric)}
              fillOpacity={0.3}
              fill={getLineColor(metric)}
            />
          ))}
          {refAreaLeft && refAreaRight && (
            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
          )}
        </AreaChart>
      );
    case 'correlation':
      // Placeholder for correlation chart - needs implementation based on specific requirements
      return (
        <Typography>Correlation chart is under development.</Typography>
      );
    default:
      return null;
  }
}, [chartType, transformedData, selectedMetrics, refAreaLeft, refAreaRight, zoom, getLineColor, getResponsiveLabel, CustomYAxisTick]);

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading || healthLoading,
    timeoutMs: 12000 // 12 seconds for complex chart data
  });

  if (hasTimedOut) {
    return (
      <LoadingTimeoutError 
        message="Chart data is taking longer than expected to load." 
        onRetry={() => {
          setLoading(false);
          onDataUpdate([], []);
        }}
      />
    );
  }

  if (loading || healthLoading) {
    return <CircularProgress />;
  }

  if (!healthData || healthData.length === 0) {
    return <Typography>No health data available</Typography>;
  }

  return (
  <Card className="health-trend-card">
    <CardHeader 
      title={
        <Typography variant="h6" style={{ fontSize: titleFontSize }}>
          Health Trends
        </Typography>
      } 
    />
    <CardContent className="health-trend-content">
      <div className="chart-controls">
        <FormControl variant="outlined" size="small">
          <InputLabel id="chart-type-label">Chart Type</InputLabel>
          <Select
            labelId="chart-type-label"
            value={chartType}
            onChange={(event: SelectChangeEvent<'line' | 'area' | 'correlation'>) => setChartType(event.target.value as 'line' | 'area' | 'correlation')}
            label="Chart Type"
          >
            <MenuItem value="line">Line</MenuItem>
            <MenuItem value="area">Area</MenuItem>
            <MenuItem value="correlation">Correlation</MenuItem>
          </Select>
        </FormControl>
        <Button
          aria-label="Open date range selector"
          variant="outlined"
          size="small"
          onClick={handleDateRangeClick}
          startIcon={<FaCalendarAlt />}
          style={{ fontSize: buttonFontSize }}
        >
          Date Range
        </Button>
      </div>
      <div className="metric-buttons">
        {metricOptions.map(({ value, label, icon }) => (
          <Button
            key={value}
            aria-label={`Toggle ${label} metric`}
            variant={selectedMetrics.includes(value) ? 'contained' : 'outlined'}
            color={selectedMetrics.includes(value) ? 'primary' : 'inherit'}
            size="small"
            onClick={() => toggleMetric(value)}
            startIcon={icon}
            className="metric-button"
            style={{
              fontSize: buttonFontSize,
              minWidth: 'auto',
              padding: '0 8px',
              flex: '0 0 auto',
            }}
          >
            {isMobile ? '' : label}
          </Button>
        ))}
      </div>
      <Typography variant="caption" className="m-2">
        {filteredData.length} data points
      </Typography>
      <Typography variant="caption" className="m-2">
        {selectedMetrics.length} metrics selected
      </Typography>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          {renderChart !== null ? renderChart : <Typography>No chart data available</Typography>}
        </ResponsiveContainer>
      </div>
      <Button onClick={zoomOut} className="m-3" style={{ fontSize: buttonFontSize }}>
        Zoom Out
      </Button>
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
        <div className="date-range-popover">
          <TextField
            label="Start Date"
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            className="m-2"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            className="m-2"
          />
          <Button onClick={handleDateRangeSubmit} className="m-2" style={{ fontSize: buttonFontSize }}>
            Apply
          </Button>
        </div>
      </Popover>
    </CardContent>
  </Card>
  );
});

HealthTrendChart.displayName = 'HealthTrendChart';

export default HealthTrendChart;