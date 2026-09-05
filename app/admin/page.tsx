import { AdminStudio } from './studio';
import { hasDatabase } from '../lib/supabase';
import { checkoutReady } from '../lib/server';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio', robots: { index: false, follow: false } };
export default function AdminPage() {
 return <main id="main-content" className="admin-page"><AdminStudio configured={hasDatabase()} paymentsReady={checkoutReady()} /></main>;
}
