import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Article } from '../client/siteApi';
import { mono } from '../theme';
import Section from './Section';
import TextLink from './TextLink';

export default function Writing({ articles }: { articles: Article[] }) {
  return (
    <Section id="writing" title="Writing" n="04">
      <Stack spacing={5} sx={{ maxWidth: 820 }}>
        {articles.map((a) => (
          <Stack key={a.url} spacing={1.75} sx={{ borderTop: 1, borderColor: 'divider', pt: 3.5, '&:first-of-type': { borderTop: 0, pt: 0 } }}>
            {a.source ? (
              <Typography sx={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>{a.source}</Typography>
            ) : null}
            <Typography variant="h3" component="h3" sx={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.12, letterSpacing: '-0.02em', textWrap: 'balance' }}>
              {a.title}
            </Typography>
            {a.summary ? <Typography color="text.secondary" sx={{ maxWidth: '62ch', textWrap: 'pretty' }}>{a.summary}</Typography> : null}
            <TextLink href={a.url} external sx={{ alignSelf: 'flex-start' }}>Read on {a.source || 'the web'}</TextLink>
          </Stack>
        ))}
      </Stack>
    </Section>
  );
}
