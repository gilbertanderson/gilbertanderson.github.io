import { Fragment } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Link, Site } from '../client/siteApi';
import { mono } from '../theme';
import { ArrowDown } from './Icons';
import TextLink from './TextLink';
import Wrap from './Wrap';

/** Splits the headline so the configured words can be shown in the accent color. */
function Headline({ text, highlights }: { text: string; highlights: string[] }) {
  const words = highlights.filter(Boolean);
  if (!words.length) return <>{text}</>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return (
    <>
      {parts.map((part, i) =>
        words.includes(part) ? (
          <Box key={i} component="span" sx={{ color: 'primary.main' }}>{part}</Box>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export default function Profile({ site, links }: { site: Site; links: Link[] }) {
  const roleLines = site.title.split(' · ');
  return (
    <Wrap component="section" id="top" aria-labelledby="name-h" sx={{ pt: { xs: 6, md: 11 }, pb: { xs: 7, md: 14 }, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {site.avatar ? <Avatar src={site.avatar} alt={`Photo of ${site.name}`} sx={{ width: 72, height: 72 }} /> : null}
        <Typography sx={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.5 }}>
          {roleLines.map((line) => (
            <Box key={line} component="span" sx={{ display: 'block' }}>{line}</Box>
          ))}
        </Typography>
      </Stack>
      <Typography
        variant="h1"
        component="h1"
        id="name-h"
        sx={{ fontSize: 'clamp(46px, 7.6vw, 112px)', maxWidth: '13ch', textWrap: 'balance' }}
      >
        <Box
          component="span"
          sx={{ display: 'block', mb: 3.5, fontFamily: mono, fontWeight: 500, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'primary.main', lineHeight: 1.4 }}
        >
          {site.name}
        </Box>
        <Headline text={site.headline} highlights={site.headline_highlights ?? []} />
      </Typography>
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', gap: '12px 28px' }}>
        <Button
          href="#work"
          variant="contained"
          endIcon={<ArrowDown width={18} height={18} />}
          sx={{ minHeight: 52, px: 3.25, bgcolor: 'text.primary', color: 'background.default', '&:hover': { bgcolor: 'text.primary', opacity: 0.88 } }}
        >
          See my work
        </Button>
        {links.map((l) => (
          <TextLink key={l.label} href={l.url} external>{l.label}</TextLink>
        ))}
        {site.resume_pdf ? <TextLink href={site.resume_pdf} download>Resume (PDF)</TextLink> : null}
        {site.resume ? <TextLink href={site.resume} download>Resume (.docx)</TextLink> : null}
      </Stack>
    </Wrap>
  );
}
