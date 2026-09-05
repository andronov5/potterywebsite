import { createClient } from '@supabase/supabase-js';
function publicKey() { return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; }
export function hasDatabase() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey()); }
export function publicDatabase() {
  if (!hasDatabase()) throw new Error('Studio database is not connected.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  });
}
