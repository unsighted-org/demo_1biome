import React from 'react';
import { render, screen } from '@testing-library/react';
import { HealthTrendChart } from '../../components/HealthTrendChart';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import { HealthEnvironmentData, ActivityLevel } from '@/types';

const mockStore = configureStore([]);

describe('HealthTrendChart', () => {
  const mockData: HealthEnvironmentData[] = [{
    _id: '123',
    id: '123',
    basicHealthId: '123',
    environmentalId: '123',
    scoresId: '123',
    userId: '123',
    date: '2024-01-01',
    timestamp: '2024-01-01T00:00:00Z',
    steps: 10000,
    heartRate: 75,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 37,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    glucose: 90,
    weight: 70,
    height: 175,
    bmi: 22.9,
    sleep: { duration: 8, quality: 0.8 },
    stress: 30,
    mood: 80,
    hydration: 70,
    nutrition: { calories: 2000, protein: 60, carbs: 250, fat: 70 },
    exercise: { duration: 30, intensity: 0.7, type: 'walking' },
    location: { latitude: 0, longitude: 0, accuracy: 10, timestamp: '2024-01-01T00:00:00Z' },
    latitude: 0,
    longitude: 0,
    nearestCity: 'Test City',
    onBorder: [],
    country: 'Test Country',
    state: 'Test State',
    continent: 'Test Continent',
    regionId: '123',
    cityId: '123',
    areaId: '123',
    airQuality: 80,
    environmentalImpact: 70,
    humidity: 60,
    airQualityIndex: 50,
    uvIndex: 5,
    noiseLevel: 40,
    airQualityDescription: 'Good',
    uvIndexDescription: 'Moderate',
    noiseLevelDescription: 'Low',
    cardioHealthScore: 85,
    respiratoryHealthScore: 90,
    physicalActivityScore: 75,
    environmentalImpactScore: 80,
    activityLevel: 'moderate' as ActivityLevel,
    activeEnergyBurned: 500
  }];

  it('renders without crashing', () => {
    render(
      <Provider store={mockStore({})}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart
            data={mockData}
            selectedMetric="cardioHealthScore"
            onDataUpdate={() => {}}
          />
        </ThemeProvider>
      </Provider>
    );
  });

  it('updates data when metric changes', () => {
    const onDataUpdate = jest.fn();
    render(
      <Provider store={mockStore({})}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart
            data={mockData}
            selectedMetric="cardioHealthScore"
            onDataUpdate={onDataUpdate}
          />
        </ThemeProvider>
      </Provider>
    );
  });

  it('handles empty data', () => {
    render(
      <Provider store={mockStore({})}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart
            data={[]}
            selectedMetric="cardioHealthScore"
            onDataUpdate={() => {}}
          />
        </ThemeProvider>
      </Provider>
    );
  });
});
