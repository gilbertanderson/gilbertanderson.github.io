import { useId, useState, type MouseEvent } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MuiLink from '@mui/material/Link';
import { ArrowDown } from './Icons';

export type Choice = { label: string; href: string; hint?: string; download?: boolean; external?: boolean };

type Props = { label: string; choices: Choice[]; fontSize?: number };

const linkLook = (fontSize?: number) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  minHeight: 44,
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: fontSize ?? 'inherit',
  lineHeight: 'inherit',
  textDecorationColor: 'var(--mui-palette-divider)',
  textUnderlineOffset: '5px',
  textDecorationThickness: '1.5px',
  '&:hover': { textDecorationColor: 'currentColor' },
});

/**
 * An underlined text control that opens a small menu of choices, styled like the other
 * text links. With a single choice there is nothing to pick, so it renders a plain link.
 */
export default function ChoiceMenu({ label, choices, fontSize }: Props) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  if (!choices.length) return null;

  const linkProps = (c: Choice) => ({
    href: c.href,
    ...(c.download ? { download: true } : {}),
    ...(c.external ? { target: '_blank', rel: 'noreferrer' } : {}),
  });

  if (choices.length === 1) {
    return (
      <MuiLink {...linkProps(choices[0])} underline="always" color="inherit" sx={linkLook(fontSize)}>
        {label}
      </MuiLink>
    );
  }

  return (
    <>
      <MuiLink
        component="button"
        type="button"
        id={`${id}-button`}
        aria-haspopup="menu"
        aria-controls={open ? `${id}-menu` : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        underline="always"
        color="inherit"
        sx={{ ...linkLook(fontSize), cursor: 'pointer' }}
      >
        {label}
        <ArrowDown width={14} height={14} />
      </MuiLink>
      <Menu id={`${id}-menu`} anchorEl={anchor} open={open} onClose={() => setAnchor(null)} slotProps={{ list: { 'aria-labelledby': `${id}-button` } }}>
        {choices.map((c) => (
          <MenuItem key={c.href} component="a" {...linkProps(c)} onClick={() => setAnchor(null)} sx={{ minHeight: 44, gap: 1.5 }}>
            <span style={{ fontWeight: 600 }}>{c.label}</span>
            {c.hint ? <span style={{ opacity: 0.7, fontSize: 13 }}>{c.hint}</span> : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
