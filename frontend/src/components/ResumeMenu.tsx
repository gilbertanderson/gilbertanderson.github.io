import { useState, type MouseEvent } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MuiLink from '@mui/material/Link';
import { ArrowDown } from './Icons';

type Props = { pdf?: string | null; docx?: string | null; label?: string; fontSize?: number };

/** One "Resume" control that lets the visitor pick the file format to download. */
export default function ResumeMenu({ pdf, docx, label = 'Resume', fontSize }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const formats = [
    pdf ? { href: pdf, name: 'PDF', hint: 'best for reading and printing' } : null,
    docx ? { href: docx, name: 'Word (.docx)', hint: 'editable' } : null,
  ].filter((f): f is { href: string; name: string; hint: string } => f !== null);

  if (!formats.length) return null;
  // With a single format there is nothing to choose, so it is a plain download link.
  if (formats.length === 1) {
    return (
      <MuiLink
        href={formats[0].href}
        download
        underline="always"
        color="inherit"
        sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontWeight: 600, fontSize, textDecorationColor: 'var(--mui-palette-divider)', textUnderlineOffset: '5px', textDecorationThickness: '1.5px' }}
      >
        {label}
      </MuiLink>
    );
  }

  return (
    <>
      <MuiLink
        component="button"
        type="button"
        id="resume-button"
        aria-haspopup="menu"
        aria-controls={open ? 'resume-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        underline="always"
        color="inherit"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minHeight: 44, fontWeight: 600, fontSize, font: 'inherit', cursor: 'pointer', textDecorationColor: 'var(--mui-palette-divider)', textUnderlineOffset: '5px', textDecorationThickness: '1.5px' }}
      >
        {label}
        <ArrowDown width={14} height={14} />
      </MuiLink>
      <Menu id="resume-menu" anchorEl={anchor} open={open} onClose={() => setAnchor(null)} slotProps={{ list: { 'aria-labelledby': 'resume-button' } }}>
        {formats.map((f) => (
          <MenuItem key={f.name} component="a" href={f.href} download onClick={() => setAnchor(null)} sx={{ minHeight: 44, gap: 1.5 }}>
            <span style={{ fontWeight: 600 }}>{f.name}</span>
            <span style={{ opacity: 0.7, fontSize: 13 }}>{f.hint}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
