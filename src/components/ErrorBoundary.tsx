// src/components/ErrorBoundary.tsx
import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Box,
  useTheme,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          minHeight: '100vh',
          bgcolor: 'background.default',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} textAlign="center">
              <ErrorIcon
                color="error"
                sx={{ fontSize: { xs: 48, sm: 64, md: 72 } }}
              />
            </Grid>

            <Grid item xs={12} textAlign="center">
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 500, mb: 2 }}
              >
                Oops! Something went wrong
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Alert 
                    severity="error" 
                    variant="outlined"
                    sx={{ mb: 3 }}
                  >
                    <AlertTitle>Error Details</AlertTitle>
                    We apologize for the inconvenience. The application encountered an unexpected error.
                  </Alert>

                  {this.state.error && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: 'background.paper',
                          borderRadius: 1
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1,
                            overflowX: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                            bgcolor: 'action.hover',
                            borderRadius: 1
                          }}
                        >
                          {this.state.error.message}
                        </Typography>
                      </Paper>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} textAlign="center">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={this.handleReset}
                startIcon={<RefreshIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Reload Application
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Container>
    );
  }
}

export default ErrorBoundary;
