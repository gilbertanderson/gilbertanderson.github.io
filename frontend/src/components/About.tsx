import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Section from './Section';

/** The first sentence is the lede; the rest sits below it in a quieter weight. */
export default function About({ bio }: { bio: string }) {
  const sentences = bio.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [bio];
  const [lede, ...rest] = sentences;
  const paragraphs: string[] = [];
  for (let i = 0; i < rest.length; i += 2) paragraphs.push(rest.slice(i, i + 2).join(' '));
  return (
    <Section id="about" title="About" n="02">
      <Stack spacing={3} sx={{ maxWidth: 820 }}>
        <Typography
          sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500, fontSize: 'clamp(24px, 2.4vw, 32px)', lineHeight: 1.3, letterSpacing: '-0.015em', textWrap: 'pretty' }}
        >
          {lede}
        </Typography>
        {paragraphs.map((p) => (
          <Typography key={p} color="text.secondary" sx={{ textWrap: 'pretty' }}>{p}</Typography>
        ))}
      </Stack>
    </Section>
  );
}
