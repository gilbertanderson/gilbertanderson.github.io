import type { CSSProperties } from 'react';
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

type Props = { content: SiteContent; contactEnabled?: boolean };

const REPO = 'https://github.com/gilbertanderson/gilbertanderson.github.io';

export default function App({ content, contactEnabled = CONTACT_ENABLED }: Props) {
  const { site, links, projects, experience, tools, credentials, how_built, contact } = content;
  const theme = {
    '--accent': site.accent ?? '#2E4BE0',
    '--accent-on-dark': site.accent_on_dark ?? '#9DB0FF',
  } as CSSProperties;

  return (
    <div style={theme}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header name={site.name} />
      <main id="main" className="feed">
        <Profile site={site} links={links} />
        {site.bio ? <About bio={site.bio} /> : null}
        {experience?.length ? <Experience roles={experience} resume={site.resume} /> : null}
        <Projects projects={projects} />
        <Tools groups={tools} credentials={credentials} />
        {how_built ? <HowBuilt data={how_built} repo={REPO} /> : null}
        <Contact contact={contact} links={links} formEnabled={contactEnabled} />
      </main>
      <Footer name={site.name} />
    </div>
  );
}
