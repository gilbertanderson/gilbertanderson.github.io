import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = { id: string; title: string; action?: ReactNode; children: ReactNode };

export default function Section({ id, title, action, children }: Props) {
  return (
    <Paper component="section" id={id} aria-labelledby={`${id}-h`} sx={{ p: { xs: 2.5, sm: 3.5 }, scrollMarginTop: 72 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
        <Typography variant="h2" component="h2" id={`${id}-h`}>{title}</Typography>
        {action}
      </Stack>
      <Box>{children}</Box>
    </Paper>
  );
}
