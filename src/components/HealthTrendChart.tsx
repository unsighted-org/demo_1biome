// components/HealthTrendChart.tsx

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { HealthEnvironmentData, HealthMetric } from '@/types'; // or wherever your types are

interface HealthTrendChartProps {
  data: HealthEnvironmentData[];
  selectedMetric: HealthMetric;
  onDataUpdate: (data: HealthEnvironmentData[], metrics: HealthMetric[]) => void;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  data,
  selectedMetric,
  onDataUpdate
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const processedData = data.map(item => {
      const metricValue = item[selectedMetric];
      let numericValue: number;
      
      if (typeof metricValue === 'number') {
        numericValue = metricValue;
      } else if (typeof metricValue === 'object' && metricValue !== null) {
        numericValue = 'value' in metricValue ? (metricValue.value as number) : 0;
      } else {
        numericValue = 0;
      }

      return {
        date: format(parseISO(item.timestamp), 'MMM dd'),
        value: numericValue
      };
    });

    setChartData(processedData);
    onDataUpdate(data, [selectedMetric]);
  }, [data, selectedMetric, onDataUpdate]);

  return (
    <div className="chart-wrapper">
      {/* 
        "chart-wrapper" is a class from your `globals.css` 
        that can define a specific width/height or other styling.
      */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={selectedMetric}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
