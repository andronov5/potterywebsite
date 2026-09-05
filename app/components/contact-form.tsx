'use client';
import { useState, type FormEvent } from 'react';
export function ContactForm({ enabled, piece }: { enabled: boolean; piece: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(data.entries())) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error || 'Could not send your message.');
      setSent(true); form.reset(); setMessage('Your message is in Natalie’s studio inbox. She can reply to the email you provided.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <form className="studio-form contact-form" onSubmit={submit}>
    {!enabled && <p className="notice">The contact form is opening soon. Please check back.</p>}
    <fieldset disabled={!enabled || busy || sent}>
      <div className="field-grid"><label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div>
      <label>What can I help with?<select name="topic" defaultValue={piece ? 'Product question' : 'Custom piece'}><option>Custom piece</option><option>Product question</option><option>Order question</option><option>Something else</option></select></label>
      <label>Your message<textarea name="message" rows={6} minLength={10} maxLength={4000} required defaultValue={piece ? `Hi Natalie! I’m interested in ${piece}. ` : ''} /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="ink-button" type="submit">{busy ? 'Sending…' : sent ? 'Message sent' : 'Send message'}</button>
    </fieldset><p role="status" className="form-status">{message}</p>
  </form>;
}
