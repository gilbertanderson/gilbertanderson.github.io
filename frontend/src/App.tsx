import { useMemo } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { SiteContent } from './client/siteApi';
import { CONTACT_ENABLED } from './config';
import About from './components/About';
import Contact from './components/Contact';
import Experience from './components/Experience';
import Footer from './components/Footer';
import Header from './components/Header';
import HowBuilt from './components/HowBuilt';
import LinkedInPosts from './components/LinkedInPosts';
import Profile from './components/Profile';
import Projects from './components/Projects';
import Tools from './components/Tools';
import Writing from './components/Writing';
import { makeTheme } from './theme';

type Props = { content: SiteContent; contactEnabled?: boolean };

const REPO = 'https://github.com/gilbertanderson/gilbertanderson.github.io';

export default function App({ content, contactEnabled = CONTACT_ENABLED }: Props) {
  const { site, links, projects, experience, writing, tools, core_skills, credentials, how_built, contact, linkedin_posts } = content;
  const linkedinProfile = links.find((l) => /linkedin\.com/.test(l.url))?.url;
  const theme = useMemo(() => makeTheme(site.accent, site.accent_on_dark), [site.accent, site.accent_on_dark]);
  // Follow the visitor's browser theme; browsers that report no preference get dark.
  const defaultMode = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'system' : 'dark';

  return (
    <ThemeProvider
      theme={theme}
      defaultMode={defaultMode}
      // New keys, so choices saved by the old toggle are ignored and everyone starts on their browser theme.
      modeStorageKey="ga-color-mode"
      colorSchemeStorageKey="ga-color-scheme"
    >
      <CssBaseline />
      <Box
        component="a"
        href="#main"
        sx={{ position: 'absolute', left: 8, top: -48, zIndex: 2000, bgcolor: 'background.paper', p: 1, borderRadius: 1, '&:focus': { top: 8 } }}
      >
        Skip to content
      </Box>
      <Header name={site.name} />
      <Box component="main" id="main">
        <Profile site={site} links={links} />
        <Projects projects={projects} />
        {site.bio ? <About bio={site.bio} /> : null}
        {experience?.length ? <Experience roles={experience} resume={site.resume} resumePdf={site.resume_pdf} /> : null}
        {writing?.length ? <Writing articles={writing} /> : null}
        <Tools groups={tools} skills={core_skills} credentials={credentials} />
        {how_built ? <HowBuilt data={how_built} repo={REPO} /> : null}
        {linkedin_posts?.length ? <LinkedInPosts posts={linkedin_posts} profile={linkedinProfile} /> : null}
        <Contact contact={contact} links={links} formEnabled={contactEnabled} />
      </Box>
      <Footer name={site.name} />
    </ThemeProvider>
  );
}
