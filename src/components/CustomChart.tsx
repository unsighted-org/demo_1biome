import { Map, BarChart as BarChartIcon, Timeline } from '@mui/icons-material';
import { Box} from '@mui/material';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface CustomChartProps {
  data: HealthEnvironmentData[];
  metrics: HealthMetric[];
  chartType: 'line' | 'bar' | 'pie' | '1D' | '2D' | '3D';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CustomChart: React.FC<CustomChartProps> = ({ data, metrics, chartType }) => {
  const renderPieChart = (): JSX.Element => {
    const pieData = metrics.map((metric) => ({
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
  };

  const renderLineOrBarChart = (): JSX.Element => {
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

  const render2DView = (): JSX.Element => (
    <ResponsiveContainer width="100%" height="100%">
      <div className="chart-container">
        <Map style={{ fontSize: 50, marginRight: 20 }} />
        <BarChartIcon style={{ fontSize: 50, marginRight: 20 }} />
        <Timeline style={{ fontSize: 50 }} />
      </div>
    </ResponsiveContainer>
  );

  const render3DView = (): JSX.Element => (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {data.map((item, index) => (
        <mesh
          key={index}
          position={[
            item.longitude / 10,
            item.latitude / 10,
            (item[metrics[0]] as number) / 10
          ]}
        >
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color={COLORS[index % COLORS.length]} />
        </mesh>
      ))}
    </Canvas>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {chartType === 'pie' && renderPieChart()}
      {(chartType === 'line' || chartType === 'bar' || chartType === '1D') && renderLineOrBarChart()}
      {chartType === '2D' && render2DView()}
      {chartType === '3D' && render3DView()}
    </Box>
  );
};

export default CustomChart;
