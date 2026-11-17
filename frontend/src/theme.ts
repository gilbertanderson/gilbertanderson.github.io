import { createTheme } from '@mui/material/styles';

const display = '"Space Grotesk", Inter, system-ui, sans-serif';
export const mono = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function makeTheme(accent = '#0B63CE', accentOnDark = '#6CB2FF') {
  return createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: accent },
          background: { default: '#FAFAF7', paper: '#FFFFFF' },
          text: { primary: '#111214', secondary: '#5A5B55' },
          divider: '#DBDAD3',
          action: { hover: '#EFEEE9' },
        },
      },
      dark: {
        palette: {
          primary: { main: accentOnDark, contrastText: '#0E1020' },
          background: { default: '#101113', paper: '#1A1B1E' },
          text: { primary: '#ECECEA', secondary: '#A9A9A3' },
          divider: '#2B2D31',
          action: { hover: '#1A1B1E' },
        },
      },
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      body1: { fontSize: '1.0625rem', lineHeight: 1.6 },
      h1: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 0.98 },
      h2: { fontFamily: display, fontWeight: 600, fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.1 },
      h3: { fontFamily: display, fontWeight: 600, fontSize: '1.625rem', letterSpacing: '-0.015em', lineHeight: 1.2 },
      h4: { fontFamily: display, fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.1 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
    },
  });
}
