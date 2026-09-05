'use client';
import { useState, type FormEvent } from 'react';

export function ContactForm({ piece }: { piece: string }) {
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (data.get('_honey')) { setMessage('Unable to prepare this message.'); return; }
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const topic = String(data.get('topic') || 'Contact request').trim();
    const note = String(data.get('message') || '').trim();
    const subject = `Pottery by Natalie — ${topic}`;
    const body = `Hi Natalie,\n\n${note}\n\nFrom: ${name}\nReply to: ${email}`;
    window.location.href = `mailto:natspottery@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage('Your email app should open. Review the message there and press Send.');
  }
  return <form className="studio-form contact-form" onSubmit={submit}>
    <fieldset>
      <div className="field-grid"><label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div>
      <label>What can I help with?<select name="topic" defaultValue={piece ? 'Product question' : 'Custom piece'}><option>Custom piece</option><option>Product question</option><option>Order question</option><option>Something else</option></select></label>
      <label>Your message<textarea name="message" rows={6} minLength={10} maxLength={4000} required defaultValue={piece ? `Hi Natalie! I’m interested in ${piece}. ` : ''} /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="_honey" tabIndex={-1} autoComplete="off" /></label>
      <button className="ink-button" type="submit">Continue to email</button>
    </fieldset><p role="status" className="form-status">{message}</p>
  </form>;
}
