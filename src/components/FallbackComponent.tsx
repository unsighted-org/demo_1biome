import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const FallbackComponent: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const router = useRouter();

  const handleReset = () => {
    resetErrorBoundary();
    router.push('/'); // Redirect to home page
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong.
      </Typography>
      <Typography variant="body1" paragraph>
        We apologize for the inconvenience. Please try again or return to the home page.
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Error: {error.message}
      </Typography>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleReset}>
          Return to Home
        </Button>
      </Box>
    </Box>
  );
};

export default FallbackComponent;