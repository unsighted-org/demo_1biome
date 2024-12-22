import {
  Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  CardHeader, Typography, useMediaQuery, useTheme, Popover, TextField, CircularProgress,
  Box, SxProps, Theme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaHeart, FaLungs, FaWind, FaRunning, FaCalendarAlt, FaSync } from 'react-icons/fa';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const { data: optimizedData, loading: chartLoadingState, error: chartError, progress } = useChartOptimization(
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
    if (healthData && healthData.length > 0 && !startDate && !endDate) {
      const sortedData = [...healthData].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const firstDate = new Date(sortedData[0].timestamp);
      const lastDate = new Date(sortedData[sortedData.length - 1].timestamp);
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

  useEffect(() => {
    const handleResize = (): void => {
      setChartKey(Date.now());
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    onDataUpdate(optimizedData, selectedMetrics);
  }, [optimizedData, selectedMetrics, onDataUpdate]);

  const handleRefresh = useCallback(async () => {
    if (!loading && !healthLoading) {
      setLoading(true);
      await fetchHealthData(1);
      setCurrentPage(1);
      setLoading(false);
    }
  }, [fetchHealthData, loading, healthLoading]);

  useImperativeHandle(ref, () => ({
    refreshData: handleRefresh
  }), [handleRefresh]);

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
    if (healthData && healthData.length > 0) {  
      const sortedData = [...healthData].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setStartDate(new Date(sortedData[0].timestamp));
      setEndDate(new Date(sortedData[sortedData.length - 1].timestamp));
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

  const loadMoreData = useCallback(async () => {
    if (!loading && !healthLoading) {
      setLoading(true);
      const nextPage = currentPage + 1;
      await fetchHealthData(nextPage);
      setCurrentPage(nextPage);
      setLoading(false);
    }
  }, [fetchHealthData, loading, healthLoading, currentPage]);

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading || healthLoading || chartLoadingState,
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

  const handleMetricChange = useCallback((event: SelectChangeEvent<HealthMetric[]>) => {
    const value = event.target.value;
    setSelectedMetrics(typeof value === 'string' ? value.split(',') as HealthMetric[] : value);
  }, []);

  const availableMetrics = useMemo(() => [
    'cardioHealthScore',
    'respiratoryHealthScore',
    'physicalActivityScore',
    'environmentalImpactScore',
  ], []);

  // Handle empty data state
  if (!loading && !healthLoading && !chartLoadingState && (!optimizedData || optimizedData.length === 0)) {
    return (
      <div className="health-trend-card">
        <div className="health-trend-header">
          <Typography variant="h6">Health Trends</Typography>
        </div>
        <div className="health-trend-content">
          <div className="health-trend-empty">
            <Typography variant="body1" color="textSecondary">
              No health data available yet.
            </Typography>
            <Button
              variant="contained"
              onClick={handleRefresh}
              startIcon={<FaSync />}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (chartError) {
    return (
      <div className="health-trend-card">
        <div className="health-trend-header">
          <Typography variant="h6">Health Trends</Typography>
        </div>
        <div className="health-trend-content">
          <div className="health-trend-empty">
            <Typography variant="body1" color="error">
              {chartError.message || 'Failed to load health data'}
            </Typography>
            <Button
              variant="contained"
              onClick={handleRefresh}
              startIcon={<FaSync />}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle data loading optimization
  useEffect(() => {
    if (optimizedData && optimizedData.length > 0) {
      const interval = setInterval(() => {
        if (!loading && !healthLoading) {
          handleRefresh();
        }
      }, 300000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [optimizedData, loading, healthLoading, handleRefresh]);

  // Handle window resize for chart
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      setChartLoading(true);
      resizeTimeout = setTimeout(() => {
        setChartKey(Date.now());
        setChartLoading(false);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  if (hasTimedOut) {
    return <LoadingTimeoutError onRetry={() => fetchHealthData(1)} />;
  }

  return (
    <div className="health-trend-card">
      <div className="health-trend-header">
        <div className="health-trend-controls">
          <Typography variant="h6">Health Trends</Typography>
          <div className="health-trend-buttons">
            <Button
              size="small"
              variant={chartType === 'line' ? 'contained' : 'outlined'}
              onClick={() => setChartType('line')}
              sx={{ minWidth: 100 }}
            >
              Line
            </Button>
            <Button
              size="small"
              variant={chartType === 'area' ? 'contained' : 'outlined'}
              onClick={() => setChartType('area')}
              sx={{ minWidth: 100 }}
            >
              Area
            </Button>
            <Button
              size="small"
              onClick={handleDateRangeClick}
              startIcon={<FaCalendarAlt />}
              sx={{ minWidth: 120 }}
            >
              Date Range
            </Button>
          </div>
        </div>
      </div>
      <div className="health-trend-content">
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Health Metrics</InputLabel>
          <Select
            multiple
            value={selectedMetrics}
            onChange={handleMetricChange}
            label="Health Metrics"
            renderValue={(selected) => (
              <div className="health-trend-metrics">
                {(selected as string[]).map((value) => (
                  <div key={value} className="health-trend-metric">
                    {value.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                ))}
              </div>
            )}
          >
            {availableMetrics.map((metric) => (
              <MenuItem key={metric} value={metric}>
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="health-trend-chart-container">
          {(loading || healthLoading || chartLoadingState) ? (
            <div className="health-trend-loading">
              <CircularProgress size={40} />
              <Typography variant="body2" color="textSecondary">
                Loading health data...
              </Typography>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart}
            </ResponsiveContainer>
          )}
        </div>

        {!loading && !healthLoading && !chartLoadingState && optimizedData.length > 0 && (
          <div className="health-trend-footer">
            <Button
              variant="outlined"
              onClick={loadMoreData}
              disabled={loading || healthLoading}
              sx={{ minWidth: 200 }}
            >
              Load More Data
            </Button>
          </div>
        )}
      </div>

      <Popover
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
        <div className="health-trend-date-picker">
          <TextField
            label="Start Date"
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={handleDateRangeSubmit}
            disabled={!startDateInput || !endDateInput}
          >
            Apply Range
          </Button>
        </div>
      </Popover>
    </div>
  );
});

HealthTrendChart.displayName = 'HealthTrendChart';

export default HealthTrendChart;