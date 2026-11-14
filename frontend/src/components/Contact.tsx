import type { FormEvent } from 'react';
import { useSendContactMutation, type ContactSection, type Link } from '../client/siteApi';
import { ArrowRight } from './Icons';

type Props = { contact: ContactSection; links: Link[]; formEnabled: boolean };

export default function Contact({ contact, links, formEnabled }: Props) {
  return (
    <section id="contact" className="card pad" aria-labelledby="contact-h">
      <div className="contact">
        <div className="contact-intro">
          <h2 id="contact-h">{contact.heading}</h2>
          {contact.blurb ? <p className="muted">{contact.blurb}</p> : null}
          <div className="actions">
            {links.map((l) => (
              <a key={l.label} className="btn btn-outline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            ))}
          </div>
        </div>
        {formEnabled ? <ContactForm /> : null}
      </div>
    </section>
  );
}

export function ContactForm() {
  const [sendContact, { isLoading, isSuccess, isError, data, reset }] = useSendContactMutation();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    const result = await sendContact({
      contactMessage: {
        name: String(fields.get('name') ?? ''),
        email: String(fields.get('email') ?? ''),
        message: String(fields.get('message') ?? ''),
      },
    });
    if ('data' in result) form.reset();
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} onChange={() => (isSuccess || isError) && reset()}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" type="text" autoComplete="name" required maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" autoComplete="email" required maxLength={320} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" name="message" rows={5} required maxLength={5000} />
      </div>
      <div className="form-foot">
        <button className="btn btn-primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Send message'} <ArrowRight width={16} height={16} />
        </button>
        <p role="status" className="muted form-status">
          {isSuccess ? data?.detail : null}
          {isError ? 'Something went wrong. Please try again, or reach me on GitHub.' : null}
        </p>
      </div>
    </form>
  );
}
