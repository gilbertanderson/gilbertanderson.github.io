import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import { Moon, Sun } from './Icons';

export default function ThemeToggle({ sx }: { sx?: object }) {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return null;
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <IconButton
      color="inherit"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setMode(dark ? 'light' : 'dark')}
      sx={{ flex: '0 0 auto', width: 44, height: 44, border: 1, ...sx }}
    >
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  );
}
