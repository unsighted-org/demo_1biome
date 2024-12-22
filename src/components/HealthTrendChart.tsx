import { Button, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, Popover, TextField } from '@mui/material';
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
  const { healthData, loading: healthLoading, fetchHealthData } = useHealth();
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [chartKey, setChartKey] = useState<number>(Date.now());
  const [chartLoading, setChartLoading] = useState(false);

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

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading || healthLoading || chartLoadingState,
    timeoutMs: 12000
  });

  const handleRefresh = useCallback(async () => {
    if (!loading && !healthLoading) {
      setLoading(true);
      await fetchHealthData(1);
      setCurrentPage(1);
      setLoading(false);
    }
  }, [fetchHealthData, loading, healthLoading]);

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

  const handleMetricChange = useCallback((event: SelectChangeEvent<HealthMetric[]>) => {
    const value = event.target.value;
    setSelectedMetrics(typeof value === 'string' ? value.split(',') as HealthMetric[] : value);
  }, []);

  const loadMoreData = useCallback(async () => {
    if (!loading && !healthLoading) {
      setLoading(true);
      const nextPage = currentPage + 1;
      await fetchHealthData(nextPage);
      setCurrentPage(nextPage);
      setLoading(false);
    }
  }, [fetchHealthData, loading, healthLoading, currentPage]);

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

  useImperativeHandle(ref, () => ({
    refreshData: handleRefresh
  }), [handleRefresh]);

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

  useEffect(() => {
    if (startDate) {
      setStartDateInput(format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      setEndDateInput(format(endDate, 'yyyy-MM-dd'));
    }
  }, [startDate, endDate]);

  useEffect(() => {
    onDataUpdate(optimizedData, selectedMetrics);
  }, [optimizedData, selectedMetrics, onDataUpdate]);

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

  const availableMetrics: HealthMetric[] = ['cardioHealthScore', 'respiratoryHealthScore', 'physicalActivityScore', 'environmentalImpactScore'];

  // Empty state
  if (!loading && !healthLoading && !chartLoadingState && (!optimizedData || optimizedData.length === 0)) {
    return (
      <div className="health-trend-card">
        <div className="health-trend-header">
          <Typography variant="h6">Health Trends</Typography>
        </div>
        <div className="health-trend-content">
          <div className="health-trend-empty">
            <Typography variant="body1" className="text-secondary">
              No health data available yet.
            </Typography>
            <Button
              variant="contained"
              onClick={handleRefresh}
              className="metric-button"
              startIcon={<FaSync />}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
              className="metric-button"
              startIcon={<FaSync />}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasTimedOut) {
    return <LoadingTimeoutError onRetry={() => fetchHealthData(1)} />;
  }

  return (
    <div className="health-trend-card">
      <div className="health-trend-header">
        <div className="health-trend-controls">
          <Typography variant="h6">Health Trends</Typography>
          <div className="metric-buttons">
            <Button
              size="small"
              variant={chartType === 'line' ? 'contained' : 'outlined'}
              onClick={() => setChartType('line')}
              className="metric-button"
            >
              Line
            </Button>
            <Button
              size="small"
              variant={chartType === 'area' ? 'contained' : 'outlined'}
              onClick={() => setChartType('area')}
              className="metric-button"
            >
              Area
            </Button>
            <Button
              size="small"
              onClick={handleDateRangeClick}
              startIcon={<FaCalendarAlt />}
              className="metric-button"
            >
              Date Range
            </Button>
          </div>
        </div>
      </div>

      <div className="health-trend-content">
        <FormControl fullWidth variant="outlined" size="small" className="metric-select">
          <InputLabel>Health Metrics</InputLabel>
          <Select
            multiple
            value={selectedMetrics}
            onChange={handleMetricChange}
            label="Health Metrics"
          >
            {availableMetrics.map((metric) => (
              <MenuItem key={metric} value={metric}>
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="chart-container">
          {(loading || healthLoading || chartLoadingState) ? (
            <div className="health-trend-loading">
              <CircularProgress size={40} />
              <Typography variant="body2" className="text-secondary">
                Loading health data...
              </Typography>
            </div>
          ) : (
            <ResponsiveContainer>
              {chartType === 'line' ? (
                <LineChart data={optimizedData} syncId="healthTrendChart">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(tick) => formatDate(tick)} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatDate(label)} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                  ) : null}
                </LineChart>
              ) : (
                <AreaChart data={optimizedData} syncId="healthTrendChart">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(tick) => formatDate(tick)} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatDate(label)} />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                  ) : null}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {!loading && !healthLoading && !chartLoadingState && optimizedData.length > 0 && (
          <div className="health-trend-footer">
            <Button
              variant="outlined"
              onClick={loadMoreData}
              disabled={loading || healthLoading}
              className="metric-button"
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
        <div className="date-range-popover">
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