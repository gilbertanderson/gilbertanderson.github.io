import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { mono } from '../theme';
import Wrap from './Wrap';

type Props = { id: string; title: string; n: string; action?: ReactNode; children: ReactNode };

/** A ruled band: numbered label on the left, content on the right. */
export default function Section({ id, title, n, action, children }: Props) {
  return (
    <Box component="section" id={id} aria-labelledby={`${id}-h`} sx={{ borderTop: 1, borderColor: 'divider', scrollMarginTop: '72px' }}>
      <Wrap sx={{ py: { xs: 6, md: 9 }, display: 'flex', flexWrap: 'wrap', gap: '32px 48px' }}>
        <Box sx={{ flex: '0 0 200px' }}>
          <Typography sx={{ fontFamily: mono, fontSize: 13, color: 'primary.main', mb: 1 }}>{n}</Typography>
          <Typography variant="h2" component="h2" id={`${id}-h`}>{title}</Typography>
          {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
        </Box>
        <Box sx={{ flex: '1 1 560px', minWidth: 0 }}>{children}</Box>
      </Wrap>
    </Box>
  );
}
