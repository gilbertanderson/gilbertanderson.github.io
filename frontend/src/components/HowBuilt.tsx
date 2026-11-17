import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { HowBuilt as HowBuiltData } from '../client/siteApi';
import Section from './Section';
import TextLink from './TextLink';

export default function HowBuilt({ data, repo }: { data: HowBuiltData; repo?: string }) {
  return (
    <Section id="built" title={data.heading} n="07">
      <Stack spacing={2.5} sx={{ maxWidth: 820 }}>
        {data.blurb ? <Typography sx={{ fontSize: 20, textWrap: 'pretty' }}>{data.blurb}</Typography> : null}
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {data.points.map((p) => <li key={p}>{p}</li>)}
        </Box>
        {repo ? <TextLink href={repo} external sx={{ alignSelf: 'flex-start' }}>View the source</TextLink> : null}
      </Stack>
    </Section>
  );
}
