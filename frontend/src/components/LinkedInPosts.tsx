import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { LinkedInPost } from '../client/siteApi';
import { mono } from '../theme';
import Section from './Section';
import TextLink from './TextLink';

/**
 * Recent LinkedIn posts. LinkedIn has no public RSS feed and blocks other sites from
 * reading posts, so they are listed in site.toml and picked up on the next build.
 */
export default function LinkedInPosts({ posts, profile }: { posts: LinkedInPost[]; profile?: string }) {
  return (
    <Section id="linkedin" title="From LinkedIn" n="08">
      <Stack spacing={4} sx={{ maxWidth: 820 }}>
        {posts.map((p) => (
          <Box
            key={p.url}
            component="article"
            sx={{ borderTop: 1, borderColor: 'divider', pt: 3.5, '&:first-of-type': { borderTop: 0, pt: 0 } }}
          >
            <Typography sx={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}>
              {p.date}
            </Typography>
            <Typography
              component="blockquote"
              sx={{ m: 0, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500, fontSize: 'clamp(20px, 2vw, 24px)', lineHeight: 1.4, letterSpacing: '-0.01em', textWrap: 'pretty' }}
            >
              {p.text}
            </Typography>
            {p.context ? <Typography color="text.secondary" sx={{ mt: 1.5, textWrap: 'pretty' }}>{p.context}</Typography> : null}
            <TextLink href={p.url} external sx={{ mt: 1 }}>View on LinkedIn</TextLink>
          </Box>
        ))}
        {profile ? (
          <TextLink href={`${profile.replace(/\/$/, '')}/recent-activity/all/`} external sx={{ alignSelf: 'flex-start' }}>
            See all my LinkedIn posts
          </TextLink>
        ) : null}
      </Stack>
    </Section>
  );
}
