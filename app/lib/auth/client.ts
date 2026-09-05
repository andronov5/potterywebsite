'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error('Studio authentication is not connected.');
  // The public password setup route explicitly consumes PKCE and invite links.
  return createBrowserClient(url, key, { auth: { detectSessionInUrl: false } });
}
