import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Link, Site } from '../client/siteApi';
import { ArrowDown } from './Icons';

export default function Profile({ site, links }: { site: Site; links: Link[] }) {
  return (
    <Paper component="section" id="top" aria-labelledby="name-h" sx={{ overflow: 'hidden' }}>
      <Box sx={{ height: { xs: 96, sm: 160 }, bgcolor: 'primary.main' }}>
        {site.banner ? <Box component="img" src={site.banner} alt="" sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }} /> : null}
      </Box>
      <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3 }}>
        {site.avatar ? (
          <Avatar
            src={site.avatar}
            alt={`Photo of ${site.name}`}
            sx={{ width: 112, height: 112, mt: -7, mb: 1.5, border: 4, borderColor: 'background.paper' }}
          />
        ) : null}
        <Typography variant="h1" component="h1" id="name-h">{site.name}</Typography>
        <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{site.title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{site.headline}</Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" href="#work">See my work</Button>
          <Button variant="outlined" href="#contact">Contact</Button>
          {links.map((l) => (
            <Button key={l.label} variant="outlined" href={l.url} target="_blank" rel="noreferrer">{l.label}</Button>
          ))}
          {site.resume ? (
            <Button variant="outlined" href={site.resume} download endIcon={<ArrowDown width={16} height={16} />}>Resume</Button>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  );
}
