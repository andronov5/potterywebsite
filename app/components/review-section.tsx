'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Review = { id: string; name: string; rating: number; body: string; created_at: string };
export function ReviewSection({ productSlug, enabled }: { productSlug: string; enabled: boolean }) {
 const [reviews, setReviews] = useState<Review[]>([]); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const [loadError, setLoadError] = useState(false);
 useEffect(() => {
  if (!enabled) return;
  let active = true;
  fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`).then(async r => { if (!r.ok) throw Error(); const d = await r.json(); if (active) setReviews(d.reviews); }).catch(() => { if (active) setLoadError(true); });
  return () => { active = false; };
 }, [productSlug, enabled]);
 async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); const form = e.currentTarget; const d = new FormData(form); setBusy(true); setStatus('');
  try {
   const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_slug: productSlug, name: d.get('name'), rating: Number(d.get('rating')), body: d.get('body') }) });
   const data = await r.json(); if (!r.ok) throw Error(data.error || 'Please try again.');
   setStatus('Thank you! Your review was sent to Natalie and will appear after review.'); form.reset();
  } catch (e) { setStatus(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 if (!enabled) return null;
 return <section className="reviews-section"><div className="reviews-summary"><p className="eyebrow">From the community</p><h2>Reviews</h2><p>{loadError ? 'Reviews are temporarily unavailable.' : reviews.length ? `${reviews.length} published reviews` : 'No reviews yet.'}</p></div>
 <div className="review-content"><div className="review-list">{reviews.map(r => <article key={r.id}><header><strong>{r.name}</strong><span aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}</span></header><p>{r.body}</p><small>{new Date(r.created_at).toLocaleDateString()}</small></article>)}</div>
 <form className="studio-form" onSubmit={submit}><h3>Leave a review</h3><label>Your name<input name="name" required maxLength={100} /></label><label>Rating<select name="rating" defaultValue="5">{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} out of 5</option>)}</select></label><label>Your review<textarea name="body" rows={4} required minLength={10} maxLength={2000} /></label><button className="ink-button" disabled={busy}>{busy ? 'Sending…' : 'Submit review'}</button><p role="status">{status}</p></form></div></section>;
}
