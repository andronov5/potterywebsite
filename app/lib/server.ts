import 'server-only';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createHash } from 'node:crypto';
export function serviceDatabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Studio database is not connected.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function reviewSubmissionReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export function checkoutReady() {
  return Boolean(process.env.CHECKOUT_ENABLED === 'true' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SHIPPING_RATE_ID && process.env.SITE_URL?.startsWith('https://'));
}
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Payments are not connected.');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}
export async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Send JSON data.');
  if (Number(request.headers.get('content-length')) > 32000) throw new Error('Message is too large.');
  const text = await request.text();
  if (text.length > 32000) throw new Error('Message is too large.');
  return JSON.parse(text);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.SITE_URL || new URL(request.url).origin;
  return !origin || origin === new URL(expected).origin;
}
export async function allowRequest(request: Request, scope: string, limit: number) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const key = createHash('sha256').update(`${process.env.SUPABASE_SERVICE_ROLE_KEY}:${scope}:${ip}`).digest('hex');
  const { data, error } = await serviceDatabase().rpc('take_rate_limit', { bucket_key: key, max_requests: limit });
  if (error) throw new Error('Please try again later.');
  return data === true;
}
