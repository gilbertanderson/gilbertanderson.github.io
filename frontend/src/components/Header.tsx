import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const links = [
  ['Projects', '#work'],
  ['About', '#about'],
  ['Experience', '#experience'],
  ['Skills', '#tools'],
] as const;

export default function Header({ name }: { name: string }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="md">
        <Toolbar component="nav" aria-label="Main" disableGutters sx={{ gap: 1 }}>
          <Typography component="a" href="#top" variant="h3" sx={{ color: 'text.primary', textDecoration: 'none', flexGrow: 1 }}>
            {name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {links.map(([label, href]) => (
              <Button key={href} href={href} color="inherit" size="small" sx={{ color: 'text.secondary', px: { xs: 1, sm: 1.5 } }}>
                {label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
