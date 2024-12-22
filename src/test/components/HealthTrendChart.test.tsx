import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HealthTrendChart from '@/components/HealthTrendChart';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';

const mockStore = configureStore([]);

describe('HealthTrendChart', () => {
  let store: any;
  const mockOnDataUpdate = jest.fn();

  beforeEach(() => {
    store = mockStore({
      health: {
        data: [
          {
            timestamp: '2024-01-01',
            environmentalImpactScore: 85,
            cardioHealthScore: 75,
            respiratoryHealthScore: 80,
          },
          {
            timestamp: '2024-01-02',
            environmentalImpactScore: 88,
            cardioHealthScore: 78,
            respiratoryHealthScore: 82,
          },
        ],
      },
    });
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart onDataUpdate={mockOnDataUpdate} />
        </ThemeProvider>
      </Provider>
    );
    expect(screen.getByTestId('health-trend-chart')).toBeInTheDocument();
  });

  it('displays correct metrics', () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart onDataUpdate={mockOnDataUpdate} />
        </ThemeProvider>
      </Provider>
    );
    expect(screen.getByText(/Environmental Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Cardio Health/i)).toBeInTheDocument();
    expect(screen.getByText(/Respiratory Health/i)).toBeInTheDocument();
  });

  it('updates chart on metric selection', () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <HealthTrendChart onDataUpdate={mockOnDataUpdate} />
        </ThemeProvider>
      </Provider>
    );
    const metricSelect = screen.getByRole('combobox');
    fireEvent.change(metricSelect, { target: { value: 'cardioHealthScore' } });
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });
});
