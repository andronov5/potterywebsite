'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '../../lib/auth/client';
import { finishPasswordLink } from '../../lib/auth/recovery';

export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const initialization = useRef<Promise<string> | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(configured ? 'Checking your password link…' : 'Studio login is not connected yet.');

  useEffect(() => {
    if (!configured) return;
    let active = true;
    if (!initialization.current) {
      const url = new URL(window.location.href);
      initialization.current = finishPasswordLink(createAuthClient(), url);
    }
    initialization.current.then(userEmail => {
      // Remove one-time credentials only after successful validation. A failed
      // callback must stay failed on reload, even if an older cookie exists.
      window.history.replaceState(null, '', window.location.pathname);
      if (active) { setEmail(userEmail); setStatus(''); }
    }).catch(() => {
      if (active) setStatus('This link could not be verified. Return to login and request a new password link.');
    });
    return () => { active = false; };
  }, [configured]);

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setStatus('Your passwords do not match.'); return; }
    setBusy(true);
    setStatus('');
    try {
      const { error } = await createAuthClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace('/admin');
      router.refresh();
    } catch {
      setStatus('The password could not be saved. Try a different password or request a new link.');
      setBusy(false);
    }
  }

  return <form className="studio-form login-card" onSubmit={savePassword}>
    <h1>Set your studio password</h1>
    {email !== null && <>
      <p>{email}</p>
      <label>New password<input type="password" minLength={12} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
      <label>Confirm password<input type="password" minLength={12} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label>
      <button className="ink-button" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
    </>}
    <p role="status">{status}</p>
    <Link href="/admin/login" className="text-button">Back to login</Link>
  </form>;
}
