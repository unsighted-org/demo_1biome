import React, { useEffect, useState } from 'react';
import { Typography, CircularProgress, Alert, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useRouter } from 'next/router';
import { HealthTrendChart } from '@/components/HealthTrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { HealthEnvironmentData, HealthMetric } from '@/types';

const Stats: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { healthData, loading, error, fetchHealthData } = useHealth();
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric>('cardioHealthScore');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchHealthData();
    }
  }, [user, router, fetchHealthData]);

  const handleDataUpdate = (data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    console.log('Health data updated:', data);
    console.log('Available metrics:', metrics);
  };

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh"
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error">Error loading health data: {error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Health Statistics
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Metric</InputLabel>
        <Select
          value={selectedMetric}
          label="Select Metric"
          onChange={(e) => setSelectedMetric(e.target.value as HealthMetric)}
        >
          <MenuItem value="cardioHealthScore">Cardio Health</MenuItem>
          <MenuItem value="respiratoryHealthScore">Respiratory Health</MenuItem>
          <MenuItem value="physicalActivityScore">Physical Activity</MenuItem>
          <MenuItem value="environmentalImpactScore">Environmental Impact</MenuItem>
        </Select>
      </FormControl>

      <Container sx={{ height: 400, width: '100%' }}>
        <HealthTrendChart
          data={healthData}
          selectedMetric={selectedMetric}
          onDataUpdate={handleDataUpdate}
        />
      </Container>
    </Container>
  );
};

export default Stats;
