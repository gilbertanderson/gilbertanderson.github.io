import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Role } from '../client/siteApi';
import Section from './Section';

export default function Experience({ roles, resume }: { roles: Role[]; resume?: string | null }) {
  return (
    <Section
      id="experience"
      title="Experience"
      action={resume ? <Button size="small" href={resume} download>Full resume (.docx)</Button> : undefined}
    >
      <Stack component="ol" spacing={3} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {roles.map((r) => (
          <Stack component="li" key={`${r.company}-${r.period}`} direction="row" spacing={2}>
            <Avatar variant="rounded" aria-hidden="true" sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>{r.company.charAt(0)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" component="h3">{r.title}</Typography>
              <Typography sx={{ fontWeight: 500 }}>{r.company}</Typography>
              <Typography variant="body2" color="text.secondary">{r.period}</Typography>
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary' }}>
                {r.highlights.map((h) => <li key={h}>{h}</li>)}
              </Box>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Section>
  );
}
