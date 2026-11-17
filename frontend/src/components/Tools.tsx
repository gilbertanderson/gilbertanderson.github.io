import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ToolGroup } from '../client/siteApi';
import { mono } from '../theme';
import Section from './Section';

/** Rows of label + items; `slash` joins the items on one line, otherwise they stack. */
function Rows({ groups, slash }: { groups: ToolGroup[]; slash?: boolean }) {
  return (
    <Box>
      {groups.map((g) => (
        <Box key={g.group} sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 40px', py: 2.75, borderTop: 1, borderColor: 'divider', '&:first-of-type': { pt: 0, borderTop: 0 } }}>
          <Typography
            variant="h3"
            component="h3"
            sx={{ flex: '0 0 170px', fontFamily: mono, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.8 }}
          >
            {g.group}
          </Typography>
          <Box
            component="ul"
            sx={{
              m: 0,
              p: 0,
              listStyle: 'none',
              flex: '1 1 340px',
              minWidth: 0,
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: slash ? 'row' : 'column',
              rowGap: slash ? 0.5 : 0.75,
              fontSize: 18,
              lineHeight: 1.5,
              ...(slash && { '& li:not(:last-child)::after': { content: '"/"', mx: 1.5, color: 'divider' } }),
            }}
          >
            {g.items.map((t) => <li key={t}>{t}</li>)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function Tools({ groups, credentials }: { groups: ToolGroup[]; credentials?: ToolGroup[] }) {
  return (
    <>
      <Section id="tools" title="Skills" n="05"><Rows groups={groups} slash /></Section>
      {credentials?.length ? (
        <Section id="education" title="Education & certifications" n="06"><Rows groups={credentials} /></Section>
      ) : null}
    </>
  );
}
