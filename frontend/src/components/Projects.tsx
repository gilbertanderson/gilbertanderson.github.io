import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Project } from '../client/siteApi';
import { ArrowRight } from './Icons';
import Section from './Section';

function Thumb({ project }: { project: Project }) {
  const sx = { width: 1, height: { xs: 160, sm: 1 }, minHeight: 130, borderRadius: 1.5, objectFit: 'cover', display: 'block' } as const;
  if (project.image) {
    return <Box component="img" sx={sx} src={project.image} alt={`Preview of ${project.title}`} loading="lazy" />;
  }
  return (
    <Box aria-hidden="true" sx={{ ...sx, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', p: 2, fontWeight: 700 }}>
      {project.title}
    </Box>
  );
}

function Group({ label, projects }: { label: string; projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <Box sx={{ '& + &': { mt: 3 } }}>
      <Typography variant="overline" component="h3" color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: '.08em' }}>
        {label}
      </Typography>
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {projects.map((p) => (
          <Paper
            component="li"
            key={p.title}
            sx={{ p: 1.5, display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '220px 1fr' }, '&:hover': { borderColor: 'primary.main' } }}
          >
            <Thumb project={p} />
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.kind}</Typography>
              <Typography variant="h4" component="h4">{p.title}</Typography>
              <Typography color="text.secondary">{p.description}</Typography>
              <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: 'wrap', pt: 0.5 }}>
                <Button size="small" href={p.url} target="_blank" rel="noreferrer" endIcon={<ArrowRight width={16} height={16} />}>
                  {p.link_label ?? 'View on GitHub'}
                </Button>
                {p.article_url ? (
                  <Button size="small" href={p.article_url} target="_blank" rel="noreferrer" endIcon={<ArrowRight width={16} height={16} />}>
                    Read the write-up
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <Section id="work" title="Projects">
      <Group label="Design work" projects={projects.filter((p) => p.category === 'design')} />
      <Group label="Development work" projects={projects.filter((p) => p.category !== 'design')} />
    </Section>
  );
}
