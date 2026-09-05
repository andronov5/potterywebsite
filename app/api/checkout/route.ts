import { z } from 'zod';
import Stripe from 'stripe';
import { applySession } from '../../lib/fulfillment';
import { allowRequest, checkoutReady, readBody, sameOrigin, serviceDatabase, stripeClient } from '../../lib/server';
export const runtime = 'nodejs';
const schema = z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100), quantity: z.number().int().min(1).max(10), request_id: z.uuid() });
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Please open checkout from the shop.' }, { status: 403 });
  if (!checkoutReady()) return Response.json({ error: 'Online checkout is not open yet.' }, { status: 503 });
  try {
    const body = schema.safeParse(await readBody(request));
    if (!body.success) return Response.json({ error: 'Please choose a valid piece and quantity.' }, { status: 400 });
    if (!await allowRequest(request, 'checkout', 15)) return Response.json({ error: 'Please wait ten minutes before trying again.' }, { status: 429 });
    const db = serviceDatabase();
    const { data: order, error } = await db.rpc('reserve_product', {
      request_id: body.data.request_id, requested_slug: body.data.slug, requested_quantity: body.data.quantity,
      config: { site_url: new URL(process.env.SITE_URL!).origin, shipping_rate: process.env.STRIPE_SHIPPING_RATE_ID, automatic_tax: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
    });
    if (error) return Response.json({ error: /sold out|not available/.test(error.message) ? error.message : 'This checkout could not be started. Please refresh the page.' }, { status: 409 });
    if (order.status !== 'reserved') return Response.json({ error: 'This checkout has already finished. Please refresh the page.' }, { status: 409 });
    const stripe = stripeClient();
    if (order.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (session.status === 'expired') await applySession(session, 'expired');
      if (session.payment_status === 'paid') await applySession(session, 'paid');
      if (session.status !== 'open' || !session.url) return Response.json({ error: 'This checkout has closed. Please refresh the page.' }, { status: 409 });
      return Response.json({ url: session.url });
    }
    // Reuse the immutable reservation snapshot on retries. Do not release stock on
    // network errors: Stripe may have created a payable session before the timeout.
    if (Date.now() - Date.parse(order.created_at) > 23 * 60 * 60 * 1000) return Response.json({ error: 'Please contact Natalie about this checkout.' }, { status: 409 });
    let session;
    try { session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['card'], client_reference_id: order.id,
      metadata: { order_id: order.id }, expires_at: Number(order.expires_unix),
      line_items: [{ price_data: { currency: 'usd', unit_amount: order.unit_price_cents, product_data: { name: order.product_name }, tax_behavior: 'exclusive' }, quantity: order.quantity }],
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [{ shipping_rate: order.checkout_config.shipping_rate }],
      automatic_tax: { enabled: order.checkout_config.automatic_tax },
      success_url: `${order.checkout_config.site_url}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${order.checkout_config.site_url}/product/${order.product_slug}?checkout=cancelled`,
    }, { idempotencyKey: order.id });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError && error.statusCode === 400) {
        // Stripe rejected creation before a session could be created. Network,
        // server and idempotency errors stay reserved for reconciliation.
        const released = await db.rpc('release_uncreated_checkout', { order_id: order.id });
        if (released.error) throw new Error('Checkout recovery failed.');
      }
      throw error;
    }
    const saved = await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saved.error || !session.url) throw new Error('Checkout could not be saved.');
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: 'Checkout could not open. Please try again; if it keeps failing, contact Natalie. No payment is confirmed here.' }, { status: 503 });
  }
}
