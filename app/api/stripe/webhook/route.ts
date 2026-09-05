import { applySession } from '../../../lib/fulfillment';
import { stripeClient } from '../../../lib/server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) return new Response('Webhook unavailable', { status: 400 });
  let event;
  try { event = stripeClient().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return new Response('Invalid signature', { status: 400 }); }
  try {
    if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') await applySession(event.data.object, 'paid');
    if (event.type === 'checkout.session.expired') await applySession(event.data.object, 'expired');
    return Response.json({ received: true });
  } catch { return new Response('Order update failed; retry this event', { status: 500 }); }
}
