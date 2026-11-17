import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Role } from '../client/siteApi';
import { mono } from '../theme';
import Section from './Section';
import TextLink from './TextLink';

type Row = { title: string; meta: string; highlights: string[] };

/** One row per position; a flat role becomes a single position with no meta line. */
function rowsFor(role: Role): Row[] {
  if (role.positions?.length) {
    return role.positions.map((p) => ({
      title: p.title,
      meta: [p.period, p.note].filter(Boolean).join(' · '),
      highlights: p.highlights,
    }));
  }
  return [{ title: role.title ?? '', meta: '', highlights: role.highlights ?? [] }];
}

export default function Experience({ roles, resume }: { roles: Role[]; resume?: string | null }) {
  return (
    <Section
      id="experience"
      title="Experience"
      n="03"
      action={resume ? <TextLink href={resume} download sx={{ fontSize: 15 }}>Full resume (.docx)</TextLink> : undefined}
    >
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {roles.map((role) => (
          <Box
            component="li"
            key={`${role.company}-${role.period}`}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px 40px', py: 4, borderTop: 1, borderColor: 'divider', '&:first-of-type': { pt: 0, borderTop: 0 } }}
          >
            <Typography sx={{ flex: '0 0 170px', fontFamily: mono, fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>{role.period}</Typography>
            <Stack spacing={2.75} sx={{ flex: '1 1 340px', minWidth: 0 }}>
              <Typography variant="h3" component="h3">{role.company}</Typography>
              {rowsFor(role).map((row) => (
                <Stack key={row.title} spacing={0.75}>
                  <Typography variant="h4" component="h4" sx={{ fontFamily: 'inherit', fontSize: 17, fontWeight: 600, letterSpacing: 0, lineHeight: 1.4 }}>
                    {row.title}
                  </Typography>
                  {row.meta ? <Typography sx={{ fontFamily: mono, fontSize: 12, color: 'text.secondary' }}>{row.meta}</Typography> : null}
                  <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.5, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {row.highlights.map((h) => <li key={h}>{h}</li>)}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
