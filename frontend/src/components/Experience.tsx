import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Role } from '../client/siteApi';
import Section from './Section';

function Bullets({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary' }}>
      {items.map((h) => <li key={h}>{h}</li>)}
    </Box>
  );
}

function RoleItem({ role }: { role: Role }) {
  const positions = role.positions ?? [];
  return (
    <Stack component="li" direction="row" spacing={2}>
      <Avatar variant="rounded" aria-hidden="true" sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
        {role.company.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {positions.length > 0 ? (
          <>
            <Typography variant="h3" component="h3">{role.company}</Typography>
            <Typography variant="body2" color="text.secondary">{role.period}</Typography>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, mt: 2, p: 0, pl: 2.5, borderLeft: 2, borderColor: 'divider' }}>
              {positions.map((p) => (
                <Box component="li" key={`${p.title}-${p.period}`} sx={{ position: 'relative', '& + &': { mt: 2.5 } }}>
                  <Box
                    aria-hidden="true"
                    sx={{ position: 'absolute', left: -31, top: 6, width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', border: 2, borderColor: 'background.paper' }}
                  />
                  <Typography variant="h3" component="h4">{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {p.period}{p.note ? ` · ${p.note}` : ''}
                  </Typography>
                  <Bullets items={p.highlights} />
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h3" component="h3">{role.title}</Typography>
            <Typography sx={{ fontWeight: 500 }}>{role.company}</Typography>
            <Typography variant="body2" color="text.secondary">{role.period}</Typography>
            <Bullets items={role.highlights ?? []} />
          </>
        )}
      </Box>
    </Stack>
  );
}

export default function Experience({ roles, resume }: { roles: Role[]; resume?: string | null }) {
  return (
    <Section
      id="experience"
      title="Experience"
      action={resume ? <Button size="small" href={resume} download>Full resume (.docx)</Button> : undefined}
    >
      <Stack component="ol" spacing={3} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {roles.map((r) => <RoleItem key={`${r.company}-${r.period}`} role={r} />)}
      </Stack>
    </Section>
  );
}
