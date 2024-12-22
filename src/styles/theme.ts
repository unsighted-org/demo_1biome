// theme.ts
import { createTheme, responsiveFontSizes, Components, Theme } from '@mui/material/styles';
import { BoxProps } from '@mui/material/Box';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiBox: keyof BoxProps;
  }

  interface Components<Theme = unknown> {
    MuiBox?: {
      defaultProps?: BoxProps;
      styleOverrides?: {
        root?: React.CSSProperties;
      };
      variants?: Array<{
        props: { className: string };
        style: React.CSSProperties;
      }>;
    };
  }
}

const baseTheme = createTheme({
  palette: {
    mode: 'dark', // Enforce dark mode
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1d1d1d',   // Darker background for paper elements
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {},
      },
      variants: [
        {
          props: { className: 'fullscreen-container' },
          style: {
            display: 'flex',
            height: '100vh',
            width: '100vw',
            position: 'relative',
            overflow: 'hidden'
          },
        },
        {
          props: { className: 'fullsize-absolute' },
          style: {
            position: 'absolute',
            width: '100%',
            height: '100%'
          },
        },
        {
          props: { className: 'glass-container' },
          style: {
            position: 'relative',
            zIndex: 1,
            margin: 'auto',
            padding: '32px',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          },
        },
      ],
    },
  },
});

const theme = responsiveFontSizes(baseTheme);

export default theme;
