import 'server-only';
import type Stripe from 'stripe';
import { serviceDatabase } from './server';
export async function applySession(session: Stripe.Checkout.Session, outcome: 'paid' | 'expired') {
  const orderId = session.metadata?.order_id;
  if (!orderId || !/^[0-9a-f-]{36}$/.test(orderId) || session.client_reference_id !== orderId) throw new Error('Unknown session.');
  if (outcome === 'paid' && session.payment_status !== 'paid') throw new Error('Payment not confirmed.');
  if (outcome === 'expired' && session.status !== 'expired') throw new Error('Session has not expired.');
  const { error } = await serviceDatabase().rpc('apply_checkout_event', {
    order_id: orderId, session_id: session.id, outcome,
    subtotal: session.amount_subtotal, total: session.amount_total,
    currency_code: session.currency, email: session.customer_details?.email || null,
  });
  if (error) throw new Error('Order update failed.');
}
