import { createTheme } from '@mui/material/styles';

const INK = '#0F172A';
const BODY = '#334155';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const PRIMARY = '#4F46E5';
const PRIMARY_HOVER = '#4338CA';
const PRIMARY_LIGHT = '#EEF2FF';
const SURFACE_ALT = '#F8FAFC';

const theme = createTheme({
  palette: {
    primary: {
      main: PRIMARY,
      dark: PRIMARY_HOVER,
      light: PRIMARY_LIGHT,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: BODY,
      secondary: MUTED,
    },
    divider: BORDER,
    background: {
      default: SURFACE_ALT,
      paper: '#FFFFFF',
    },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '3rem', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.02em', color: INK },
    h2: { fontSize: '2rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em', color: INK },
    h3: { fontSize: '1.5rem', lineHeight: 1.3, fontWeight: 700, color: INK },
    h4: { fontSize: '1.125rem', lineHeight: 1.4, fontWeight: 600, color: INK },
    body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },
    body2: { fontSize: '0.875rem', color: MUTED },
    overline: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      fontWeight: 600,
      letterSpacing: '0.06em',
      color: PRIMARY,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 180ms ease-out',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 1px 2px rgba(15,23,42,.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          color: INK,
          boxShadow: 'none',
          borderBottom: `1px solid ${BORDER}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${BORDER}` },
      },
    },
  },
});

export default theme;
