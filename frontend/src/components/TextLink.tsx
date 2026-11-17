import type { ReactNode } from 'react';
import MuiLink from '@mui/material/Link';
import type { SxProps, Theme } from '@mui/material/styles';
import { ArrowUpRight } from './Icons';

type Props = { href: string; children: ReactNode; external?: boolean; download?: boolean; sx?: SxProps<Theme> };

/** Underlined text link, the editorial replacement for outlined buttons. */
export default function TextLink({ href, children, external, download, sx }: Props) {
  return (
    <MuiLink
      href={href}
      underline="always"
      color="inherit"
      download={download}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          minHeight: 44,
          fontWeight: 600,
          textDecorationColor: 'var(--mui-palette-divider)',
          textUnderlineOffset: '5px',
          textDecorationThickness: '1.5px',
          '&:hover': { textDecorationColor: 'currentColor' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
      {external ? <ArrowUpRight width={14} height={14} /> : null}
    </MuiLink>
  );
}
