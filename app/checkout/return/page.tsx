import Link from 'next/link';
import { stripeClient } from '../../lib/server';
import { applySession } from '../../lib/fulfillment';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout status', robots: { index: false, follow: false } };
export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: id } = await searchParams;
  let paid = false;
  if (id && /^cs_(test_|live_)?[A-Za-z0-9]+$/.test(id) && id.length < 300) {
    try {
      const session = await stripeClient().checkout.sessions.retrieve(id);
      if (session.payment_status === 'paid') { await applySession(session, 'paid'); paid = true; }
    } catch { /* Never infer a successful payment from the redirect alone. */ }
  }
  return <main id="main-content" className="catalog-page status-page"><p className="eyebrow">Natalie’s Pottery</p>
    <h1>{paid ? 'Thank you for supporting handmade.' : 'Your payment is not confirmed here yet.'}</h1>
    <p>{paid ? 'Your payment is confirmed and your order is recorded. Keep the confirmation from Stripe for your records.' : 'If you completed payment, please refresh this page in a moment. Check your Stripe receipt or contact Natalie before trying to pay again.'}</p>
    {!paid && id && <Link className="ink-button" href={`/checkout/return?session_id=${encodeURIComponent(id)}`}>Check again</Link>}
    <Link className="paper-button" href="/">Back to the collection</Link><Link href="/about#contact">Contact Natalie</Link>
  </main>;
}
