'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import type { Product } from '../products';
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = product.images[active] || product.images[0];
  if (!photo) return <div className="notice">Photos are being prepared.</div>;
  function move(n: number) { setActive(value => (value + n + product.images.length) % product.images.length); }
  return <section className={`detail-gallery tone-${product.tone}`} aria-label="Product photos">
    <button className="detail-main-photo" type="button" onClick={() => dialog.current?.showModal()} aria-label={`Enlarge photo of ${product.name}`}>
      <span className="detail-photo-frame"><span className="frame-image"><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 940px) 90vw, 50vw" priority /></span></span><span className="gallery-counter">Enlarge photo +</span>
    </button>
    {product.images.length > 1 && <><div className="gallery-controls"><button onClick={() => move(-1)} aria-label="Previous photo">← Previous</button><span aria-live="polite">{active + 1} / {product.images.length}</span><button onClick={() => move(1)} aria-label="Next photo">Next →</button></div>
      <div className="gallery-thumbnails">{product.images.map((image, i) => <button key={image.src} onClick={() => setActive(i)} aria-label={`View photo ${i + 1}`} aria-pressed={i === active}><Image src={image.src} alt="" width={240} height={300} /></button>)}</div></>}
    <dialog ref={dialog} className="photo-dialog" aria-label={`${product.name}, enlarged photo`} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} onKeyDown={e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }}>
      <button className="paper-button photo-close" onClick={() => dialog.current?.close()} autoFocus>Close ×</button><img src={photo.src} alt={photo.alt} />
      {product.images.length > 1 && <div className="lightbox-controls"><button className="paper-button" onClick={() => move(-1)}>← Previous</button><button className="paper-button" onClick={() => move(1)}>Next →</button></div>}
    </dialog>
  </section>;
}
