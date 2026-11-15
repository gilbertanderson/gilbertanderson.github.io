import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { HowBuilt as HowBuiltData } from '../client/siteApi';
import Section from './Section';

export default function HowBuilt({ data, repo }: { data: HowBuiltData; repo?: string }) {
  return (
    <Section id="built" title={data.heading}>
      {data.blurb ? <Typography color="text.secondary">{data.blurb}</Typography> : null}
      <Box component="ul" sx={{ mt: 1, pl: 2.5 }}>
        {data.points.map((p) => <li key={p}>{p}</li>)}
      </Box>
      {repo ? <Button href={repo} target="_blank" rel="noreferrer" sx={{ mt: 1 }}>View the source</Button> : null}
    </Section>
  );
}
