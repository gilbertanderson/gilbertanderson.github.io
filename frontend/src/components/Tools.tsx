import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ToolGroup } from '../client/siteApi';
import Section from './Section';

function Groups({ groups }: { groups: ToolGroup[] }) {
  return (
    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {groups.map((g) => (
        <Box key={g.group}>
          <Typography variant="h3" component="h3" sx={{ mb: 1 }}>{g.group}</Typography>
          <Stack component="ul" direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap', listStyle: 'none', m: 0, p: 0 }}>
            {g.items.map((t) => <Chip key={t} component="li" label={t} size="small" variant="outlined" />)}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

export default function Tools({ groups, credentials }: { groups: ToolGroup[]; credentials?: ToolGroup[] }) {
  return (
    <>
      <Section id="tools" title="Skills"><Groups groups={groups} /></Section>
      {credentials?.length ? (
        <Section id="education" title="Education & certifications"><Groups groups={credentials} /></Section>
      ) : null}
    </>
  );
}
