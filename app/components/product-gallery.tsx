"use client";

import { useState } from "react";
import type { Product } from "../products";

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const image = product.images[active];

  function move(direction: number) {
    setActive((current) =>
      (current + direction + product.images.length) % product.images.length,
    );
  }

  return (
    <section className={`detail-gallery tone-${product.tone}`} aria-label="Product gallery">
      <div className="detail-main-photo">
        <img src={image.src} alt={image.alt} width="1200" height="1400" />
        <span className="gallery-counter" aria-live="polite">
          {active + 1} / {product.images.length}
        </span>
      </div>
      <div className="gallery-controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous photo">
          ← Prev
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next photo">
          Next →
        </button>
      </div>
      <div className="gallery-thumbnails" aria-label="Choose a product photo">
        {product.images.map((galleryImage, index) => (
          <button
            type="button"
            key={galleryImage.src}
            onClick={() => setActive(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-pressed={active === index}
          >
            <img src={galleryImage.src} alt="" width="240" height="280" />
            <span>{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
