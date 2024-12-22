import {
  Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  CardHeader, Typography, useMediaQuery, useTheme, Popover, TextField, CircularProgress,
  Box, SxProps, Theme
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
import { useChartOptimization } from '@/hooks/useChartOptimization';
import { optimizationManager } from '@/utils/optimizationManager';

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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const { data: optimizedData, loading: chartLoading, error: chartError, progress } = useChartOptimization(
    healthData,
    selectedMetrics,
    startDate,
    endDate,
    {
      windowSize: 100,
      maxPoints: 1000,
      aggregationInterval: 50,
      onProgress: (p) => {
        optimizationManager.recordProgress('chart_loading', p);
      }
    }
  );

  const getResponsiveLabel = useCallback((value: number) => {
    const label = getHealthScoreDescription(value);
    if (isMobile) {
      return label.substring(0, 1);
    } else if (isTablet) {
      return label.substring(0, 3);
    }
    return label;
  }, [isMobile, isTablet]);

  const CustomYAxisTick = useCallback(({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
        {payload.value}
      </text>
    </g>
  ), []);

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

  const [chartKey, setChartKey] = useState(0);
  
  useEffect(() => {
    const handleResize = (): void => {
      setChartKey(prevKey => prevKey + 1);
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    onDataUpdate(optimizedData, selectedMetrics);
  }, [optimizedData, selectedMetrics, onDataUpdate]);

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
    if (startDateInput && endDateInput) {
      setStartDate(new Date(startDateInput));
      setEndDate(new Date(endDateInput));
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
    setAnchorEl(null);
  }, [startDateInput, endDateInput]);

  useEffect(() => {
    if (startDate) {
      setStartDateInput(format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      setEndDateInput(format(endDate, 'yyyy-MM-dd'));
    }
  }, [startDate, endDate]);

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
  }, [refAreaLeft, refAreaRight]);

  const zoomOut = useCallback(() => {
    if (healthData.length > 0) {
      setStartDate(new Date(healthData[0].timestamp));
      setEndDate(new Date(healthData[healthData.length - 1].timestamp));
    }
    setRefAreaLeft('');
    setRefAreaRight('');
  }, [healthData]);

  const getLineColor = useCallback((metric: HealthMetric): string => {
    const latestData = optimizedData[optimizedData.length - 1];
    if (latestData) {
      return getColorForMetric(metric, latestData[metric]);
    }
    return getMetricColor(metric);
  }, [optimizedData]);

  const renderChart = useMemo(() => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={optimizedData}
            onMouseDown={e => e?.activeLabel && setRefAreaLeft(e.activeLabel)}
            onMouseMove={e => e?.activeLabel && refAreaLeft && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp: string) => formatDate(timestamp)}
              height={60}
              tick={CustomYAxisTick}
            />
            <YAxis tickFormatter={getResponsiveLabel} tick={CustomYAxisTick} />
            <Tooltip
              labelFormatter={(timestamp: string) => formatDate(timestamp)}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}`,
                name.replace(/([A-Z])/g, ' $1').trim()
              ]}
            />
            <Legend />
            {selectedMetrics.map(metric => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={getLineColor(metric)}
                dot={false}
                strokeWidth={2}
              />
            ))}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="rgba(255, 255, 255, 0.1)"
              />
            )}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={optimizedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp: string) => formatDate(timestamp)}
              height={60}
              tick={CustomYAxisTick}
            />
            <YAxis tickFormatter={getResponsiveLabel} tick={CustomYAxisTick} />
            <Tooltip
              labelFormatter={(timestamp: string) => formatDate(timestamp)}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}`,
                name.replace(/([A-Z])/g, ' $1').trim()
              ]}
            />
            <Legend />
            {selectedMetrics.map(metric => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={getLineColor(metric)}
                fill={getLineColor(metric)}
                fillOpacity={0.1}
              />
            ))}
          </AreaChart>
        );
      default:
        return <div>No chart type selected</div>;
    }
  }, [chartType, optimizedData, selectedMetrics, refAreaLeft, refAreaRight, zoom, getLineColor, getResponsiveLabel, CustomYAxisTick]);

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading || healthLoading || chartLoading,
    timeoutMs: 12000
  });

  const buttonStyle: React.CSSProperties = {
    fontSize: buttonFontSize
  };

  const loadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  };

  const chartContainerStyle: React.CSSProperties = {
    width: '100%',
    height: 400
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  };

  if (hasTimedOut) {
    return <LoadingTimeoutError onRetry={() => fetchHealthData(1)} />;
  }

  if (chartError) {
    return (
      <Typography color="error">
        Error loading chart data: {chartError.message}
      </Typography>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6" style={{ fontSize: titleFontSize }}>
            Health Trends
          </Typography>
        }
        action={
          <>
            <Button
              onClick={handleDateRangeClick}
              startIcon={<FaCalendarAlt />}
              style={buttonStyle}
            >
              Date Range
            </Button>
            <Button
              onClick={zoomOut}
              disabled={!refAreaLeft && !refAreaRight}
              style={buttonStyle}
            >
              Reset Zoom
            </Button>
          </>
        }
      />
      <CardContent>
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 } as SxProps<Theme>}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as typeof chartType)}
            label="Chart Type"
          >
            <MenuItem value="line">Line Chart</MenuItem>
            <MenuItem value="area">Area Chart</MenuItem>
          </Select>
        </FormControl>
        <div style={buttonContainerStyle}>
          {metricOptions.map(({ value, label, icon }) => (
            <Button
              key={value}
              variant={selectedMetrics.includes(value) ? 'contained' : 'outlined'}
              onClick={() => toggleMetric(value)}
              startIcon={icon}
              style={buttonStyle}
            >
              {isMobile ? '' : label}
            </Button>
          ))}
        </div>
        <div style={chartContainerStyle}>
          {(loading || healthLoading || chartLoading) ? (
            <div style={loadingContainerStyle}>
              <CircularProgress />
              {progress > 0 && (
                <Typography variant="caption" sx={{ ml: 1 } as SxProps<Theme>}>
                  {Math.round(progress * 100)}%
                </Typography>
              )}
            </div>
          ) : (
            <ResponsiveContainer key={chartKey}>
              {renderChart}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleDateRangeClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box component="div" sx={{ p: 2 } as SxProps<Theme>}>
          <TextField
            label="Start Date"
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            sx={{ mb: 2 } as SxProps<Theme>}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            sx={{ mb: 2 } as SxProps<Theme>}
            fullWidth
          />
          <Button onClick={handleDateRangeSubmit} variant="contained" fullWidth>
            Apply
          </Button>
        </Box>
      </Popover>
    </Card>
  );
});

HealthTrendChart.displayName = 'HealthTrendChart';

export default HealthTrendChart;