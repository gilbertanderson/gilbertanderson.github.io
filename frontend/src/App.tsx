import type { CSSProperties } from 'react';
import type { SiteContent } from './client/siteApi';
import { CONTACT_ENABLED } from './config';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Tools from './components/Tools';

type Props = { content: SiteContent; contactEnabled?: boolean };

export default function App({ content, contactEnabled = CONTACT_ENABLED }: Props) {
  const { site, links, projects, tools, contact } = content;
  const theme = {
    '--accent': site.accent ?? '#2E4BE0',
    '--accent-on-dark': site.accent_on_dark ?? '#9DB0FF',
  } as CSSProperties;

  return (
    <div style={theme}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header name={site.name} />
      <main id="main">
        <Hero site={site} links={links} />
        <Projects projects={projects} />
        <Tools groups={tools} />
        <Contact contact={contact} links={links} formEnabled={contactEnabled} />
      </main>
      <Footer name={site.name} />
    </div>
  );
}
