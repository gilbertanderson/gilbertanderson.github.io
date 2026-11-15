import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { ThemeProvider } from '@mui/material/styles';
import type { SiteContent } from './client/siteApi';
import { CONTACT_ENABLED } from './config';
import About from './components/About';
import Contact from './components/Contact';
import Experience from './components/Experience';
import Footer from './components/Footer';
import Header from './components/Header';
import HowBuilt from './components/HowBuilt';
import Profile from './components/Profile';
import Projects from './components/Projects';
import Tools from './components/Tools';
import { makeTheme } from './theme';

type Props = { content: SiteContent; contactEnabled?: boolean };

const REPO = 'https://github.com/gilbertanderson/gilbertanderson.github.io';

export default function App({ content, contactEnabled = CONTACT_ENABLED }: Props) {
  const { site, links, projects, experience, tools, credentials, how_built, contact } = content;
  const theme = useMemo(() => makeTheme(site.accent ?? undefined), [site.accent]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="a"
        href="#main"
        sx={{ position: 'absolute', left: 8, top: -48, zIndex: 2000, bgcolor: 'background.paper', p: 1, borderRadius: 1, '&:focus': { top: 8 } }}
      >
        Skip to content
      </Box>
      <Header name={site.name} />
      <Container component="main" id="main" maxWidth="md" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Profile site={site} links={links} />
          <Projects projects={projects} />
          {site.bio ? <About bio={site.bio} /> : null}
          {experience?.length ? <Experience roles={experience} resume={site.resume} /> : null}
          <Tools groups={tools} credentials={credentials} />
          {how_built ? <HowBuilt data={how_built} repo={REPO} /> : null}
          <Contact contact={contact} links={links} formEnabled={contactEnabled} />
        </Stack>
      </Container>
      <Footer name={site.name} />
    </ThemeProvider>
  );
}
