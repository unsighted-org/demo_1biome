import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { act } from 'react-dom/test-utils';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the API
jest.mock('@/lib/AuthApi', () => ({
  useApi: () => ({
    login: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
    signUp: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
    signOut: jest.fn().mockResolvedValue(undefined),
  }),
}));

const TestComponent = () => {
  const { user, login, signOut, loading } = useAuth();
  return (
    <div>
      {loading && <div>Loading...</div>}
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <button onClick={() => login('test@example.com', 'password')}>
          Sign In
        </button>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  it('provides authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    
    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      fireEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('handles sign out', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Sign in first
    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      fireEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument();
    });

    // Then sign out
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      fireEvent.click(signOutButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
