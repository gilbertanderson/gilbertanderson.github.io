import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { Moon, Sun } from './Icons';

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
      size="small"
      color="inherit"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setMode(dark ? 'light' : 'dark')}
      sx={{ color: 'text.secondary' }}
    >
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  );
}

export default function Header({ name }: { name: string }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="md">
        <Toolbar component="nav" aria-label="Main" disableGutters sx={{ gap: 1 }}>
          <Typography
            component="a"
            href="#top"
            variant="h3"
            sx={{ color: 'text.primary', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap', mr: 'auto' }}
          >
            {name}
          </Typography>
          {/* On narrow phones the links scroll sideways instead of wrapping or overflowing the page. */}
          <Box
            sx={{
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
              <Button
                key={href}
                href={href}
                color="inherit"
                size="small"
                sx={{ color: 'text.secondary', px: { xs: 1, sm: 1.5 }, flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {label}
              </Button>
            ))}
          </Box>
          <ThemeToggle />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
