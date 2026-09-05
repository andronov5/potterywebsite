'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Review = { id: string; name: string; rating: number; body: string; created_at: string };
export function ReviewSection({ productSlug, enabled, canSubmit }: { productSlug: string; enabled: boolean; canSubmit: boolean }) {
 const [reviews, setReviews] = useState<Review[]>([]); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const [loadError, setLoadError] = useState(false);
 const [rating, setRating] = useState(0);
 useEffect(() => {
  if (!enabled) return;
  let active = true;
  fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`).then(async r => { if (!r.ok) throw Error(); const d = await r.json(); if (active) setReviews(d.reviews); }).catch(() => { if (active) setLoadError(true); });
  return () => { active = false; };
 }, [productSlug, enabled]);
 async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); if (!canSubmit || busy) return; const form = e.currentTarget; const d = new FormData(form); setBusy(true); setStatus('');
  try {
   const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_slug: productSlug, name: d.get('name'), rating: Number(d.get('rating')), body: d.get('body') }) });
   const data = await r.json(); if (!r.ok) throw Error(data.error || 'Please try again.');
   setStatus('Thank you! Your review will appear after Natalie approves it.'); form.reset(); setRating(0);
  } catch (e) { setStatus(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
 }
 if (!enabled) return null;
 return <section className="reviews-section"><div className="reviews-summary"><p className="eyebrow">From the community</p><h2>Reviews</h2><p>{loadError ? 'Reviews are temporarily unavailable.' : reviews.length ? `${reviews.length} published reviews` : 'No reviews yet.'}</p></div>
 <div className="review-content"><div className="review-list">{reviews.map(r => <article key={r.id}><header><strong>{r.name}</strong><span role="img" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span></header><p>{r.body}</p><small>{new Date(r.created_at).toLocaleDateString()}</small></article>)}</div>
 <form className="studio-form review-form" onSubmit={submit}><h3>Leave a review</h3><fieldset disabled={busy}>
 <label>Your name<input name="name" required maxLength={100} /></label>
 <fieldset className="rating-field"><legend>Rating</legend><div className="star-options">{[1,2,3,4,5].map(n => <label key={n}>
 <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} required />
 <span aria-hidden="true">{n <= rating ? '★' : '☆'}</span><span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span>
 </label>)}</div></fieldset>
 <label>Your review<textarea name="body" rows={4} required minLength={10} maxLength={2000} /></label><button className="ink-button" disabled={!canSubmit || busy}>{busy ? 'Sending…' : 'Submit review'}</button></fieldset><p role="status">{status || (!canSubmit ? 'Review submissions are temporarily unavailable.' : '')}</p></form></div></section>;
}
