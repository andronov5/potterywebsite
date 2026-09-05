import { AdminStudio } from './studio';
import { hasDatabase } from '../lib/supabase';
import { checkoutReady } from '../lib/server';
import { createAuthClient } from '../lib/auth/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio', robots: { index: false, follow: false } };
export default async function AdminPage() {
 if (!hasDatabase()) return <main id="main-content" className="admin-page"><section className="login-card"><p className="eyebrow">Natalie’s studio</p><h1>Studio login</h1><p>The studio login is ready to connect. The site owner needs to complete the one-time account setup before you can sign in.</p><Link href="/" className="paper-button">View the collection</Link></section></main>;
 const db = await createAuthClient();
 const { data } = await db.auth.getClaims();
 if (!data?.claims?.sub) redirect('/admin/login');
 const membership = await db.from('admin_users').select('user_id').eq('user_id', data.claims.sub).maybeSingle();
 if (!membership.data) redirect('/admin/login?error=access');
 return <main id="main-content" className="admin-page"><AdminStudio paymentsReady={checkoutReady()} /></main>;
}
