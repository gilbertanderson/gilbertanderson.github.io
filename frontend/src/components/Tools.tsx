import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { SkillLevel, ToolGroup } from '../client/siteApi';
import { mono } from '../theme';
import Section from './Section';

/** How many items a skills row shows before tucking the rest behind "+N more". */
const VISIBLE = 8;

function Row({ group, slash }: { group: ToolGroup; slash?: boolean }) {
  const [open, setOpen] = useState(false);
  const extra = slash ? Math.max(0, group.items.length - VISIBLE) : 0;
  const items = open || !extra ? group.items : group.items.slice(0, VISIBLE);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 40px', py: 2.75, borderTop: 1, borderColor: 'divider', '&:first-of-type': { pt: 0, borderTop: 0 } }}>
      <Typography
        variant="h3"
        component="h3"
        sx={{ flex: '0 0 170px', fontFamily: mono, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.8 }}
      >
        {group.group}
      </Typography>
      <Box sx={{ flex: '1 1 340px', minWidth: 0 }}>
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: slash ? 'row' : 'column',
            rowGap: slash ? 0.5 : 0.75,
            fontSize: 18,
            lineHeight: 1.5,
            ...(slash && { '& li:not(:last-child)::after': { content: '"/"', mx: 1.5, color: 'divider' } }),
          }}
        >
          {items.map((t) => <li key={t}>{t}</li>)}
        </Box>
        {extra ? (
          <Button
            size="small"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Show fewer ${group.group} skills` : `Show ${extra} more ${group.group} skills`}
            sx={{ mt: 0.5, minHeight: 44, px: 0, color: 'primary.main', fontFamily: mono, fontSize: 13, fontWeight: 500 }}
          >
            {open ? 'Show fewer' : `+${extra} more`}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

/** Rows of label + items; `slash` joins the items on one line, otherwise they stack. */
function Rows({ groups, slash }: { groups: ToolGroup[]; slash?: boolean }) {
  return (
    <Box>
      {groups.map((g) => <Row key={g.group} group={g} slash={slash} />)}
    </Box>
  );
}

/** Headline skills as cards, each with a bar that fills to its level when it scrolls into view. */
function SkillCards({ skills }: { skills: SkillLevel[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setShown(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Box
      component="ul"
      ref={ref}
      sx={{ m: 0, mb: 5, p: 0, listStyle: 'none', display: 'grid', gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(220px, 1fr))' } }}
    >
      {skills.map((s) => {
        const id = `skill-${s.name.replace(/\W+/g, '-').toLowerCase()}`;
        return (
          <Box
            component="li"
            key={s.name}
            sx={{
              p: { xs: 2, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              transition: 'transform .2s, box-shadow .2s, border-color .2s',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 3, borderColor: 'primary.main' },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
              <Typography id={id} sx={{ fontWeight: 600, fontSize: { xs: 15, sm: 16 }, lineHeight: 1.35, minWidth: 0, overflowWrap: 'anywhere' }}>{s.name}</Typography>
              <Typography sx={{ fontFamily: mono, fontSize: 13, color: 'text.secondary' }}>{s.level}%</Typography>
            </Box>
            <Box
              role="progressbar"
              aria-labelledby={id}
              aria-valuenow={s.level}
              aria-valuemin={0}
              aria-valuemax={100}
              sx={{ mt: 'auto', height: 8, borderRadius: 4, bgcolor: 'divider', overflow: 'hidden' }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: shown ? `${s.level}%` : 0,
                  borderRadius: 4,
                  bgcolor: 'primary.main',
                  transition: 'width .9s cubic-bezier(.2,.7,.2,1)',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

type Props = { groups: ToolGroup[]; skills?: SkillLevel[]; credentials?: ToolGroup[] };

export default function Tools({ groups, skills, credentials }: Props) {
  return (
    <>
      <Section id="tools" title="Skills" n="05">
        {skills?.length ? <SkillCards skills={skills} /> : null}
        <Rows groups={groups} slash />
      </Section>
      {credentials?.length ? (
        <Section id="education" title="Education & certifications" n="06"><Rows groups={credentials} /></Section>
      ) : null}
    </>
  );
}
