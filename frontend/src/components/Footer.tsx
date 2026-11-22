import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { INV } from './Contact';
import ThemeToggle from './ThemeToggle';
import Wrap from './Wrap';

export default function Footer({ name }: { name: string }) {
  return (
    <Box
      component="footer"
      sx={(theme) => ({ bgcolor: INV.bg, color: INV.mut, borderTop: 1, borderColor: INV.line, ...theme.applyStyles('dark', { bgcolor: INV.bgDark }) })}
    >
      <Wrap sx={{ py: 3.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
          <Typography variant="body2">© {new Date().getFullYear()} {name}</Typography>
          <Typography variant="body2">Built with React, MUI, TypeScript &amp; FastAPI · Hosted on GitHub Pages</Typography>
          <ThemeToggle sx={{ borderColor: INV.line, color: INV.mut }} />
        </Stack>
      </Wrap>
    </Box>
  );
}
