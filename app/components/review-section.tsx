"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  body: string;
  date: string;
};

export function ReviewSection({ productSlug }: { productSlug: string }) {
  const storageKey = `pottery-reviews-${productSlug}`;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setReviews(JSON.parse(stored));
    } catch {
      // The review form still works for the current visit if storage is blocked.
    }
  }, [storageKey]);

  const average = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0,
    [reviews],
  );

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const review: Review = {
      id: `${Date.now()}`,
      name: String(data.get("reviewer")),
      rating,
      body: String(data.get("review")),
      date: "Just now",
    };
    const next = [review, ...reviews];
    setReviews(next);
    setSaved(true);
    form.reset();
    setRating(5);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Keep the review visible for this visit if storage is blocked.
    }
  }

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-summary">
        <p className="eyebrow">Community notes</p>
        <h2 id="reviews-heading">Reviews</h2>
        <div className="rating-summary">
          <strong>{reviews.length ? average.toFixed(1) : "New"}</strong>
          <span>
            {reviews.length
              ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
              : "Be the first to leave a review"}
          </span>
        </div>
        <p className="prototype-note">
          For now, submitted reviews are saved only in this browser.
        </p>
      </div>

      <div className="review-content">
        <form className="review-form" onSubmit={submitReview}>
          <h3>Leave a review</h3>
          <label>
            Your name
            <input name="reviewer" autoComplete="name" required />
          </label>
          <fieldset>
            <legend>Rating</legend>
            <div className="star-options">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star}>
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={rating === star}
                    onChange={() => setRating(star)}
                  />
                  <span aria-hidden="true">{star}★</span>
                  <span className="sr-only">{star} out of 5 stars</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Your review
            <textarea name="review" rows={5} required />
          </label>
          <button className="ink-button" type="submit">Post review</button>
          <p className="form-status" aria-live="polite">
            {saved ? "Your review has been added." : ""}
          </p>
        </form>

        <div className="review-list" aria-live="polite">
          {reviews.length === 0 ? (
            <div className="empty-review">
              <span aria-hidden="true">☆</span>
              <p>No reviews yet. Your note can be the first one here.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <article key={review.id}>
                <header>
                  <strong>{review.name}</strong>
                  <span aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                </header>
                <p>{review.body}</p>
                <small>{review.date}</small>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
