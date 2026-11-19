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
  ['Contact', '#contact'],
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
        <Toolbar
          component="nav"
          aria-label="Main"
          disableGutters
          sx={{ minHeight: { xs: 'auto !important', sm: '72px !important' }, py: { xs: 1, sm: 0 }, columnGap: 2, rowGap: 0.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
        >
          <Typography
            component="a"
            href="#top"
            sx={{ order: 1, mr: 'auto', flex: '0 0 auto', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'text.primary', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {name}
          </Typography>
          {/*
            On phones the links get their own full-width row under the name and scroll sideways;
            the fade on the right edge shows there is more to swipe to. On wider screens they sit
            in one line between the name and the theme toggle.
          */}
          <Box
            sx={{
              order: { xs: 3, sm: 2 },
              flexBasis: { xs: '100%', sm: 'auto' },
              mx: { xs: -1.5, sm: 0 },
              display: 'flex',
              gap: 0.5,
              minWidth: 0,
              overflowX: 'auto',
              overscrollBehaviorX: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              maskImage: { xs: 'linear-gradient(to right, #000 82%, transparent)', sm: 'none' },
            }}
          >
            {links.map(([label, href]) => (
              <Button key={href} href={href} color="inherit" sx={{ color: 'text.secondary', px: 1.5, flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {label}
              </Button>
            ))}
          </Box>
          <Box sx={{ order: { xs: 2, sm: 3 }, flex: '0 0 auto' }}>
            <ThemeToggle />
          </Box>
        </Toolbar>
      </Wrap>
    </AppBar>
  );
}
