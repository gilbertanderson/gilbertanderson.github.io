import { createTheme } from '@mui/material/styles';

const display = '"Space Grotesk", Inter, system-ui, sans-serif';

export function makeTheme(accent = '#0B63CE', accentOnDark = '#6CB2FF') {
  return createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: accent },
          background: { default: '#F7F7F5', paper: '#FFFFFF' },
          text: { primary: '#1B1B1A', secondary: '#55554F' },
          divider: '#E4E3DE',
        },
      },
      dark: {
        palette: {
          primary: { main: accentOnDark, contrastText: '#0E1020' },
          background: { default: '#101113', paper: '#1A1B1E' },
          text: { primary: '#ECECEA', secondary: '#A9A9A3' },
          divider: '#2E3035',
        },
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      h1: { fontFamily: display, fontWeight: 700, fontSize: '2rem', lineHeight: 1.15 },
      h2: { fontFamily: display, fontWeight: 600, fontSize: '1.5rem' },
      h3: { fontFamily: display, fontWeight: 600, fontSize: '1.05rem' },
      h4: { fontFamily: display, fontWeight: 600, fontSize: '1.2rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { defaultProps: { variant: 'outlined' } },
    },
  });
}
