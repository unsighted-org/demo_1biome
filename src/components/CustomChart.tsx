import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface CustomChartProps {
  data: HealthEnvironmentData[];
  metrics: HealthMetric[];
  chartType: 'line' | 'bar' | 'pie';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CustomChart: React.FC<CustomChartProps> = ({ data, metrics, chartType }) => {
  if (chartType === 'pie') {
    const pieData = metrics.map((metric, _index) => ({
      name: metric,
      value: data.reduce((sum, item) => sum + (item[metric] as number), 0) / data.length,
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const Chart = chartType === 'line' ? LineChart : BarChart;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        {metrics.map((metric, index) => {
          const componentProps = {
            key: metric,
            type: "monotone",
            dataKey: metric,
            stroke: COLORS[index % COLORS.length],
            fill: COLORS[index % COLORS.length],
          };
        
          return chartType === 'line' ? (
            <Line {...componentProps} type="monotone" />
          ) : (
            <Bar {...componentProps} />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
};

export default CustomChart;