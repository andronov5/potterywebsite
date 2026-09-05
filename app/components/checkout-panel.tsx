'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { formatPrice, type Product } from '../products';
export function CheckoutPanel({ product, enabled }: { product: Product; enabled: boolean }) {
  const [quantity, setQuantity] = useState(1); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const requestId = useRef('');
  const available = enabled && product.price_cents !== null && product.stock > 0;
  async function checkout() {
    setBusy(true); setError(''); if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: product.slug, quantity, request_id: requestId.current }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not open checkout. Please try again.');
      const url = new URL(data.url); if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Checkout could not be verified.');
      window.location.assign(url.toString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); setBusy(false); }
  }
  return <section className="purchase-box" aria-labelledby="purchase-heading"><h2 id="purchase-heading">Make it yours</h2>
    {available ? <><p>{product.stock} available. Shipping and applicable tax are shown before you pay.</p>
      {product.stock > 1 && <label className="quantity-label">Quantity<select value={quantity} disabled={busy} onChange={e => { setQuantity(Number(e.target.value)); requestId.current = ''; }}>{Array.from({ length: Math.min(product.stock, 10) }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>}
      <button className="checkout-button" disabled={busy} onClick={checkout}>{busy ? 'Opening checkout…' : 'Continue to secure checkout'}<strong>{formatPrice(product.price_cents! * quantity)}</strong></button><p className="payment-note">Payment details are entered directly on Stripe’s secure checkout.</p>
    </> : <><p>{enabled && product.price_cents !== null && product.stock === 0 ? 'This piece is currently sold out.' : 'Online ordering is not open yet.'}</p><Link className="paper-button" href={`/about?piece=${encodeURIComponent(product.name)}#contact`}>Ask about this piece</Link></>}
    {error && <p className="error-message" role="alert">{error}</p>}
  </section>;
}
