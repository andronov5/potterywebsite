'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createAuthClient } from '../../lib/auth/client';

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const { error } = await createAuthClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/admin');
      router.refresh();
    } catch {
      setStatus('Could not sign in. Check your email and password.');
      setBusy(false);
    }
  }

  async function requestReset() {
    if (!email) {
      setStatus('Enter your email first, then choose Reset password.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const { error } = await createAuthClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;
      setStatus('If an account exists for that email, a password reset link will arrive shortly.');
    } catch {
      setStatus('A reset email could not be requested. Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  if (!configured) return <section className="login-card"><p className="eyebrow">Natalie’s studio</p><h1>Studio login</h1><p>The studio login is ready to connect. The site owner needs to complete the one-time account setup before you can sign in.</p><Link href="/" className="paper-button">View the collection</Link></section>;

  return <form className="studio-form login-card" onSubmit={signIn}><p className="eyebrow">A space for the maker</p><h1>Studio login</h1><p>Sign in to add pieces, update the shop, and read your messages.</p><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="ink-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><button type="button" className="text-button" onClick={requestReset} disabled={busy}>Reset password</button><p role="status">{status}</p></form>;
}
