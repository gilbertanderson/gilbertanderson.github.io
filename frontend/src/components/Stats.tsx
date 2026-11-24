import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Stat } from '../client/siteApi';
import { mono } from '../theme';

/** A row of headline figures taken from the resume. */
export default function Stats({ stats }: { stats: Stat[] }) {
  return (
    <Box
      component="dl"
      aria-label="By the numbers"
      sx={{ m: 0, mb: 6, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: '1px', bgcolor: 'divider', border: 1, borderColor: 'divider', borderRadius: '4px', overflow: 'hidden' }}
    >
      {stats.map((s) => (
        <Box key={s.label} sx={{ bgcolor: 'background.default', p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-end', gap: 0.5 }}>
          <Typography component="dt" sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.4 }}>{s.label}</Typography>
          <Typography component="dd" sx={{ m: 0, fontFamily: mono, fontWeight: 500, fontSize: { xs: 28, md: 34 }, lineHeight: 1.1, color: 'primary.main' }}>{s.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
