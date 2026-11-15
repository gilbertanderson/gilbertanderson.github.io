import type { FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSendContactMutation, type ContactSection, type Link } from '../client/siteApi';
import { ArrowRight } from './Icons';
import Section from './Section';

type Props = { contact: ContactSection; links: Link[]; formEnabled: boolean };

export default function Contact({ contact, links, formEnabled }: Props) {
  return (
    <Section id="contact" title={contact.heading}>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: formEnabled ? '1fr 1.2fr' : '1fr' } }}>
        <Stack spacing={2}>
          {contact.blurb ? <Typography color="text.secondary">{contact.blurb}</Typography> : null}
          {contact.email || contact.phone ? (
            <Stack spacing={0.5}>
              {contact.email ? (
                <Typography>Email: <MuiLink href={`mailto:${contact.email}`}>{contact.email}</MuiLink></Typography>
              ) : null}
              {contact.phone ? (
                <Typography>Phone: <MuiLink href={`tel:+1${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</MuiLink></Typography>
              ) : null}
            </Stack>
          ) : null}
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            {links.map((l) => (
              <Button key={l.label} variant="outlined" href={l.url} target="_blank" rel="noreferrer">{l.label}</Button>
            ))}
          </Stack>
        </Stack>
        {formEnabled ? <ContactForm /> : null}
      </Box>
    </Section>
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
    <Stack component="form" spacing={2} onSubmit={onSubmit} onChange={() => (isSuccess || isError) && reset()}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField id="c-name" name="name" label="Name" autoComplete="name" fullWidth slotProps={{ htmlInput: { required: true, maxLength: 200 } }} />
        <TextField id="c-email" name="email" type="email" label="Email" autoComplete="email" fullWidth slotProps={{ htmlInput: { required: true, maxLength: 320 } }} />
      </Stack>
      <TextField id="c-msg" name="message" label="Message" multiline minRows={5} fullWidth slotProps={{ htmlInput: { required: true, maxLength: 5000 } }} />
      <Stack direction="row" spacing={2} alignItems="center">
        <Button variant="contained" type="submit" disabled={isLoading} endIcon={<ArrowRight width={16} height={16} />}>
          {isLoading ? 'Sending…' : 'Send message'}
        </Button>
        <Typography role="status" variant="body2" color="text.secondary">
          {isSuccess ? data?.detail : null}
          {isError ? 'Something went wrong. Please try again, or reach me on GitHub.' : null}
        </Typography>
      </Stack>
    </Stack>
  );
}
