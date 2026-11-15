import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer({ name }: { name: string }) {
  return (
    <Container maxWidth="md" component="footer" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} {name}</Typography>
        <Typography variant="body2" color="text.secondary">Built with React, MUI, TypeScript &amp; FastAPI · Hosted on GitHub Pages</Typography>
      </Stack>
    </Container>
  );
}
