import { hasDatabase } from '../../lib/supabase';
import { ResetPasswordForm } from './reset-password-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set studio password', referrer: 'no-referrer' as const, robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <main id="main-content" className="admin-page"><ResetPasswordForm configured={hasDatabase()} /></main>;
}
