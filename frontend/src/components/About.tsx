import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Section from './Section';

/** Paragraphs are separated by a blank line; the first is the lede, shown larger. */
export default function About({ bio }: { bio: string }) {
  const [lede, ...rest] = bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <Section id="about" title="About" n="02">
      <Stack spacing={3} sx={{ maxWidth: 820 }}>
        <Typography
          sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500, fontSize: 'clamp(24px, 2.4vw, 32px)', lineHeight: 1.3, letterSpacing: '-0.015em', textWrap: 'pretty' }}
        >
          {lede}
        </Typography>
        {rest.map((p) => (
          <Typography key={p} color="text.secondary" sx={{ textWrap: 'pretty' }}>{p}</Typography>
        ))}
      </Stack>
    </Section>
  );
}
