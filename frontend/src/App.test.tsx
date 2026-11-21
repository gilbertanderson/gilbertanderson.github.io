import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { content } from './content';
import { makeStore } from './store/store';
import { API, received, server } from './test/server';

function renderApp(contactEnabled = true) {
  return render(
    <Provider store={makeStore()}>
      <App content={content} contactEnabled={contactEnabled} />
    </Provider>,
  );
}

async function fillForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Ada');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Message'), 'Hello there');
  await user.click(screen.getByRole('button', { name: /send message/i }));
}

beforeEach(() => {
  received.length = 0;
});

describe('App', () => {
  it('renders the profile and every project from the content file', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: new RegExp(content.site.name) })).toBeInTheDocument();
    const work = screen.getByRole('region', { name: 'Projects' });
    for (const p of content.projects) {
      expect(within(work).getByRole('heading', { level: 4, name: p.title })).toBeInTheDocument();
    }
  });

  it('nests several positions under one company', () => {
    renderApp();
    const exp = screen.getByRole('region', { name: 'Experience' });
    const caci = content.experience!.find((r) => r.positions?.length)!;
    const company = within(exp).getByRole('heading', { level: 3, name: caci.company });
    // Titles can repeat across companies, so look only inside this company's list item.
    const item = company.closest('li') as HTMLElement;
    for (const p of caci.positions!) {
      expect(within(item).getByRole('heading', { level: 4, name: p.title })).toBeInTheDocument();
    }
  });

  it('toggles dark mode from the header', async () => {
    renderApp();
    const user = userEvent.setup();
    const toggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
    const toDark = /dark/i.test(toggle.getAttribute('aria-label') ?? '');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: toDark ? 'Switch to light mode' : 'Switch to dark mode' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-mui-color-scheme', toDark ? 'dark' : 'light');
  });

  it('lists writing with a link to each article', () => {
    renderApp();
    const writing = screen.getByRole('region', { name: 'Writing' });
    for (const a of content.writing ?? []) {
      expect(within(writing).getByRole('heading', { level: 3, name: a.title })).toBeInTheDocument();
      expect(within(writing).getByRole('link', { name: /read on/i })).toHaveAttribute('href', a.url);
    }
  });

  it('lets visitors pick the resume format', async () => {
    renderApp();
    const user = userEvent.setup();
    const hero = screen.getByRole('region', { name: new RegExp(content.site.name) });
    await user.click(within(hero).getByRole('button', { name: /resume/i }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /pdf/i })).toHaveAttribute('href', content.site.resume_pdf);
    expect(within(menu).getByRole('menuitem', { name: /word/i })).toHaveAttribute('href', content.site.resume);
  });

  it('tucks long skill rows behind a "more" button', async () => {
    renderApp();
    const user = userEvent.setup();
    const skills = screen.getByRole('region', { name: 'Skills' });
    const more = within(skills).getAllByRole('button', { name: /more .* skills/i })[0];
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows LinkedIn posts with a link to each', () => {
    renderApp();
    const section = screen.getByRole('region', { name: 'From LinkedIn' });
    for (const p of content.linkedin_posts ?? []) {
      expect(within(section).getByText(p.text)).toBeInTheDocument();
    }
    const links = within(section).getAllByRole('link', { name: /view on linkedin/i });
    expect(links.map((a) => a.getAttribute('href'))).toEqual((content.linkedin_posts ?? []).map((p) => p.url));
  });

  it('offers a Play it menu with a choice per playable build', async () => {
    renderApp();
    const user = userEvent.setup();
    const withDemos = content.projects.find((p) => (p.demos ?? []).length > 1);
    if (!withDemos) return;
    const work = screen.getByRole('region', { name: 'Projects' });
    await user.click(within(work).getByRole('button', { name: /play it/i }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((m) => m.getAttribute('href'))).toEqual((withDemos.demos ?? []).map((d) => d.url));
  });

  it('links each project to its repository', () => {
    renderApp();
    const work = screen.getByRole('region', { name: 'Projects' });
    const hrefs = within(work).getAllByRole('link').map((a) => a.getAttribute('href'));
    const expected = content.projects.flatMap((p) => [...(p.url ? [p.url] : []), ...((p.demos ?? []).length === 1 ? [p.demos![0].url] : []), ...(p.article_url ? [p.article_url] : [])]);
    expect([...hrefs].sort()).toEqual(expected.sort());
  });

  it('hides the contact form when no backend is configured', () => {
    renderApp(false);
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
    const contact = screen.getByRole('region', { name: content.contact.heading });
    expect(within(contact).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });
});

describe('Contact form', () => {
  it('sends the message through the API and confirms', async () => {
    renderApp();
    await fillForm();
    expect(await screen.findByText('Thanks — message sent.')).toBeInTheDocument();
    expect(received).toEqual([{ name: 'Ada', email: 'ada@example.com', message: 'Hello there' }]);
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('shows an error and keeps the text when the API fails', async () => {
    server.use(http.post(`${API}/api/contact`, () => HttpResponse.json({ detail: 'down' }, { status: 503 })));
    renderApp();
    await fillForm();
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveValue('Hello there');
  });
});
