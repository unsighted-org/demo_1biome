import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HealthProvider, useHealth } from '@/contexts/HealthContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock health service
jest.mock('@/services/HealthService', () => ({
  __esModule: true,
  default: {
    setToken: jest.fn(),
    getPaginatedHealthData: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          timestamp: '2024-01-01',
          environmentalImpactScore: 85,
          cardioHealthScore: 75,
          respiratoryHealthScore: 80,
        },
      ],
      currentPage: 1,
      totalPages: 1,
    }),
  },
}));

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', token: 'test-token' },
    loading: false,
  }),
}));

const TestComponent = () => {
  const { healthData, loading, error } = useHealth();
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {healthData.map((data, index) => (
        <div key={index} data-testid="health-data">
          {data.environmentalImpactScore}
        </div>
      ))}
    </div>
  );
};

describe('HealthContext', () => {
  it('fetches and provides health data', async () => {
    render(
      <AuthProvider>
        <HealthProvider>
          <TestComponent />
        </HealthProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('health-data')).toHaveTextContent('85');
    });
  });

  it('handles errors', async () => {
    // Mock the service to throw an error
    const healthService = require('@/services/HealthService').default;
    healthService.getPaginatedHealthData.mockRejectedValueOnce(
      new Error('Failed to fetch')
    );

    render(
      <AuthProvider>
        <HealthProvider>
          <TestComponent />
        </HealthProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch');
    });
  });

  it('updates data when user changes', async () => {
    const { rerender } = render(
      <AuthProvider>
        <HealthProvider>
          <TestComponent />
        </HealthProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('health-data')).toHaveTextContent('85');
    });

    // Mock new data for the new user
    const healthService = require('@/services/HealthService').default;
    healthService.getPaginatedHealthData.mockResolvedValueOnce({
      data: [
        {
          id: '2',
          timestamp: '2024-01-02',
          environmentalImpactScore: 90,
          cardioHealthScore: 80,
          respiratoryHealthScore: 85,
        },
      ],
      currentPage: 1,
      totalPages: 1,
    });

    // Update the user
    jest.mock('@/contexts/AuthContext', () => ({
      ...jest.requireActual('@/contexts/AuthContext'),
      useAuth: () => ({
        user: { id: '2', email: 'test2@example.com', token: 'test-token-2' },
        loading: false,
      }),
    }));

    rerender(
      <AuthProvider>
        <HealthProvider>
          <TestComponent />
        </HealthProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('health-data')).toHaveTextContent('90');
    });
  });
});
