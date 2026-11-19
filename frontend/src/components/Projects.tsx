import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Project } from '../client/siteApi';
import { mono } from '../theme';
import ChoiceMenu from './ChoiceMenu';
import Section from './Section';
import TextLink from './TextLink';

type Numbered = { project: Project; n: string };

function Thumb({ project }: { project: Project }) {
  const frame = { aspectRatio: '16 / 10', bgcolor: 'action.hover', borderRadius: '6px', overflow: 'hidden' } as const;
  if (project.image) {
    return (
      <Box sx={frame}>
        <Box component="img" src={project.image} alt={`Preview of ${project.title}`} loading="lazy" sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }} />
      </Box>
    );
  }
  return (
    <Box aria-hidden="true" sx={{ ...frame, display: 'grid', placeItems: 'center', p: 2, fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      {project.title}
    </Box>
  );
}

function Group({ label, items }: { label: string; items: Numbered[] }) {
  if (!items.length) return null;
  return (
    <Box sx={{ '& + &': { mt: 7 } }}>
      <Typography
        variant="h3"
        component="h3"
        sx={{ pb: 1.75, mb: 3.5, borderBottom: 1, borderColor: 'divider', fontFamily: mono, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: '48px 40px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
        {items.map(({ project: p, n }) => (
          <Stack key={p.title} component="li" spacing={2.25} sx={{ minWidth: 0 }}>
            <Thumb project={p} />
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Box component="span" sx={{ color: 'primary.main' }}>{p.kind}</Box>
                <Box component="span" sx={{ color: 'text.secondary' }}>{n}</Box>
              </Stack>
              <Typography variant="h4" component="h4">{p.title}</Typography>
              <Typography color="text.secondary" sx={{ textWrap: 'pretty' }}>{p.description}</Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: '4px 24px' }}>
                {p.url ? <TextLink href={p.url} external>{p.link_label ?? 'View on GitHub'}</TextLink> : null}
                {p.demos?.length ? (
                  <ChoiceMenu label="Play it" choices={p.demos.map((d) => ({ label: d.label, hint: d.hint ?? undefined, href: d.url, external: true }))} />
                ) : null}
                {p.article_url ? <TextLink href={p.article_url} external>Read the write-up</TextLink> : null}
              </Stack>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const numbered = projects.map((project, i) => ({ project, n: String(i + 1).padStart(2, '0') }));
  return (
    <Section id="work" title="Projects" n="01">
      <Group label="Design work" items={numbered.filter((x) => x.project.category === 'design')} />
      <Group label="Development work" items={numbered.filter((x) => x.project.category !== 'design')} />
    </Section>
  );
}
