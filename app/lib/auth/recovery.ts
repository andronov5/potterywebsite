import type { SupabaseClient } from '@supabase/supabase-js';

// Callback errors must never fall through to a previously signed-in account.
export async function finishPasswordLink(db: SupabaseClient, url: URL) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has('error') || url.searchParams.has('error_code') || fragment.has('error') || fragment.has('error_code')) {
    throw new Error('This password link is invalid or expired.');
  }

  const code = url.searchParams.get('code');
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (url.searchParams.has('code')) {
    if (!code || fragment.has('access_token') || fragment.has('refresh_token')) throw new Error('Invalid password link.');
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else if (fragment.has('access_token') || fragment.has('refresh_token') || fragment.has('type')) {
    const type = fragment.get('type');
    if (!accessToken || !refreshToken || (type !== 'recovery' && type !== 'invite')) throw new Error('Invalid password link.');
    const { error } = await db.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
  } else if (url.searchParams.has('token_hash') || url.searchParams.has('type')) {
    throw new Error('Invalid password link.');
  }

  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error('Open a new password link from your email.');
  return data.user.email || '';
}
