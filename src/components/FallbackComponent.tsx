import React from 'react';
import { Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const FallbackComponent: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const router = useRouter();

  const handleReset = () => {
    resetErrorBoundary();
    router.push('/globescreen'); // Redirect to home page
  };

  return (
    <div className="fallback-container">
      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong.
      </Typography>
      <Typography variant="body1" className="fallback-message">
        We apologize for the inconvenience. Please try again or return to the home page.
      </Typography>
      <Typography variant="body2" color="textSecondary" className="fallback-message">
        Error: {error.message}
      </Typography>
      <div className="fallback-button">
        <Button variant="contained" color="primary" onClick={handleReset}>
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default FallbackComponent;