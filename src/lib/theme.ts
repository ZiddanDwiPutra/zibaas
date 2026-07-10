import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#1a73e8',
            },
            secondary: {
              main: '#34a853',
            },
            background: {
              default: '#f8f9fa',
              paper: '#ffffff',
            },
            text: {
              primary: '#202124',
              secondary: '#5f6368',
            },
            divider: '#dadce0',
          }
        : {
            primary: {
              main: '#bcaaa4',
            },
            secondary: {
              main: '#8d6e63',
            },
            background: {
              default: '#121212',
              paper: '#1e1b18',
            },
            text: {
              primary: '#f5f5f4',
              secondary: '#a8a29e',
            },
            divider: '#2e2a28',
          }),
    },
    typography: {
      fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: mode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            boxShadow: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: mode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
          },
        },
      },
    },
  });
};

export const theme = getTheme('dark');
export default theme;
