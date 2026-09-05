'use client';
import { useState, type FormEvent } from 'react';
export function ContactForm({ enabled, piece }: { enabled: boolean; piece: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!enabled || busy || sent) return; const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage('');
    try {
      if (data.get('website')) throw new Error('Unable to send this message.');
      const body = new URLSearchParams();
      data.forEach((value, key) => { if (typeof value === 'string') body.append(key, value); });
      const res = await fetch('/__forms.html', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!res.ok) throw new Error('Your message was not sent. Please try again or use the email link.');
      setSent(true); form.reset(); setMessage('Thank you! Your message has been sent. Natalie can reply to the email you provided.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <form className="studio-form contact-form" name="pottery-contact" method="POST" action="/__forms.html" data-netlify="true" data-netlify-honeypot="website" onSubmit={submit}>
    <input type="hidden" name="form-name" value="pottery-contact" />
    {!enabled && <p className="notice">Please use the email link to get in touch while the form is being connected.</p>}
    <fieldset disabled={!enabled || busy || sent}>
      <div className="field-grid"><label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div>
      <label>What can I help with?<select name="topic" defaultValue={piece ? 'Product question' : 'Custom piece'}><option>Custom piece</option><option>Product question</option><option>Order question</option><option>Something else</option></select></label>
      <label>Your message<textarea name="message" rows={6} minLength={10} maxLength={4000} required defaultValue={piece ? `Hi Natalie! I’m interested in ${piece}. ` : ''} /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="ink-button" type="submit">{busy ? 'Sending…' : sent ? 'Message sent' : 'Send message'}</button>
    </fieldset><p role="status" className="form-status">{message}</p>
  </form>;
}
