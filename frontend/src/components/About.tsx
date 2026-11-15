import Typography from '@mui/material/Typography';
import Section from './Section';

export default function About({ bio }: { bio: string }) {
  return (
    <Section id="about" title="About">
      <Typography>{bio}</Typography>
    </Section>
  );
}
