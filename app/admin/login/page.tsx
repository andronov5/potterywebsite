import { redirect } from 'next/navigation';
import { hasDatabase } from '../../lib/supabase';
import { createAuthClient } from '../../lib/auth/server';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio login', robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (hasDatabase()) {
    const db = await createAuthClient();
    const { data } = await db.auth.getClaims();
    if (data?.claims?.sub) {
      const membership = await db.from('admin_users').select('user_id').eq('user_id', data.claims.sub).maybeSingle();
      if (membership.data) redirect('/admin');
    }
  }

  return <main id="main-content" className="admin-page"><LoginForm configured={hasDatabase()} /></main>;
}
