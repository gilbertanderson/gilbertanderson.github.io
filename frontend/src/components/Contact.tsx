import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSendContactMutation, type ContactSection, type Link } from '../client/siteApi';
import { mono } from '../theme';
import { ArrowRight } from './Icons';
import Wrap from './Wrap';

/** The contact band is dark in both color schemes, so it uses fixed colors. */
export const INV = { bg: '#101113', bgDark: '#17191D', fg: '#F4F4F1', mut: '#A9AAA4', line: '#3A3D44', acc: '#6CB2FF' } as const;

type Props = { contact: ContactSection; links: Link[]; formEnabled: boolean };

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      /* clipboard can be unavailable (insecure context); the mailto link still works */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <Button
      onClick={copy}
      sx={{ minHeight: 44, px: 1.75, border: '1.5px solid', borderColor: INV.line, borderRadius: '4px', color: INV.fg, fontFamily: mono, fontSize: 13, fontWeight: 400 }}
    >
      {copied ? 'Copied' : 'Copy email'}
    </Button>
  );
}

export default function Contact({ contact, links, formEnabled }: Props) {
  return (
    <Box
      component="section"
      id="contact"
      aria-labelledby="contact-h"
      sx={(theme) => ({ bgcolor: INV.bg, color: INV.fg, scrollMarginTop: '72px', ...theme.applyStyles('dark', { bgcolor: INV.bgDark }) })}
    >
      <Wrap sx={{ pt: { xs: 8, md: 13 }, pb: { xs: 8, md: 12 }, display: 'flex', flexWrap: 'wrap', gap: '64px 72px' }}>
        <Stack spacing={3.5} sx={{ flex: '1 1 460px', minWidth: 0 }}>
          <Typography
            variant="h2"
            component="h2"
            id="contact-h"
            sx={{ fontSize: 'clamp(44px, 6.4vw, 96px)', letterSpacing: '-0.035em', lineHeight: 0.98, textWrap: 'balance' }}
          >
            {contact.heading}
          </Typography>
          {contact.blurb ? <Typography sx={{ color: INV.mut, maxWidth: '42ch', fontSize: 18 }}>{contact.blurb}</Typography> : null}
          {contact.email || contact.phone ? (
            <Stack spacing={0.75}>
              {contact.email ? (
                <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', gap: '4px 16px' }}>
                  <MuiLink
                    href={`mailto:${contact.email}`}
                    underline="always"
                    sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 500, fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '-0.01em', color: INV.acc, textDecorationColor: INV.line, textUnderlineOffset: '6px', overflowWrap: 'anywhere' }}
                  >
                    {contact.email}
                  </MuiLink>
                  <CopyEmail email={contact.email} />
                </Stack>
              ) : null}
              {contact.phone ? (
                <MuiLink
                  href={`tel:+1${contact.phone.replace(/\D/g, '')}`}
                  underline="none"
                  sx={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', minHeight: 44, fontFamily: mono, fontSize: 16, color: INV.fg }}
                >
                  {contact.phone}
                </MuiLink>
              ) : null}
            </Stack>
          ) : null}
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {links.map((l) => (
              <Button
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                sx={{ minHeight: 44, px: 2.5, border: '1.5px solid', borderColor: INV.line, borderRadius: '4px', color: INV.fg }}
              >
                {l.label}
              </Button>
            ))}
          </Stack>
        </Stack>
        {formEnabled ? <ContactForm /> : null}
      </Wrap>
    </Box>
  );
}

const field = {
  '& .MuiInputBase-root': { color: INV.fg, borderRadius: '4px' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: INV.line, borderWidth: 1.5 },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: INV.mut },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: INV.acc },
  '& .MuiInputLabel-root': { color: INV.mut },
  '& .MuiInputLabel-root.Mui-focused': { color: INV.acc },
} as const;

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
    <Stack component="form" spacing={2.25} onSubmit={onSubmit} onChange={() => (isSuccess || isError) && reset()} sx={{ flex: '1 1 420px', minWidth: 0, alignSelf: 'flex-end' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.25}>
        <TextField id="c-name" name="name" label="Name" autoComplete="name" fullWidth sx={field} slotProps={{ htmlInput: { required: true, maxLength: 200 } }} />
        <TextField id="c-email" name="email" type="email" label="Email" autoComplete="email" fullWidth sx={field} slotProps={{ htmlInput: { required: true, maxLength: 320 } }} />
      </Stack>
      <TextField id="c-msg" name="message" label="Message" multiline minRows={5} fullWidth sx={field} slotProps={{ htmlInput: { required: true, maxLength: 5000 } }} />
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained"
          type="submit"
          disabled={isLoading}
          endIcon={<ArrowRight width={16} height={16} />}
          sx={{ minHeight: 52, px: 3.5, bgcolor: INV.acc, color: '#0E1020', '&:hover': { bgcolor: INV.acc, opacity: 0.88 }, '&.Mui-disabled': { bgcolor: INV.line, color: INV.mut } }}
        >
          {isLoading ? 'Sending…' : 'Send message'}
        </Button>
        <Typography role="status" variant="body2" sx={{ color: INV.mut }}>
          {isSuccess ? data?.detail : null}
          {isError ? 'Something went wrong. Please try again, or reach me on GitHub.' : null}
        </Typography>
      </Stack>
    </Stack>
  );
}
