import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { Moon, Sun } from './Icons';
import Wrap from './Wrap';

const links = [
  ['Projects', '#work'],
  ['About', '#about'],
  ['Experience', '#experience'],
  ['Skills', '#tools'],
] as const;

function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return null;
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <IconButton
      color="inherit"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setMode(dark ? 'light' : 'dark')}
      sx={{ flex: '0 0 auto', width: 44, height: 44, border: 1, borderColor: 'divider', color: 'text.secondary' }}
    >
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  );
}

export default function Header({ name }: { name: string }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
      <Wrap>
        <Toolbar component="nav" aria-label="Main" disableGutters sx={{ minHeight: '72px !important', gap: 2 }}>
          <Typography
            component="a"
            href="#top"
            sx={{ flex: '0 0 auto', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'text.primary', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {name}
          </Typography>
          {/* On narrow phones the links scroll sideways instead of wrapping or overflowing the page. */}
          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              gap: 0.5,
              minWidth: 0,
              overflowX: 'auto',
              overscrollBehaviorX: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {links.map(([label, href]) => (
              <Button key={href} href={href} color="inherit" sx={{ color: 'text.secondary', px: 1.5, flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {label}
              </Button>
            ))}
          </Box>
          <ThemeToggle />
        </Toolbar>
      </Wrap>
    </AppBar>
  );
}
