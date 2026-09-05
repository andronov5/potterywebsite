import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckoutPanel } from '../../components/checkout-panel';
import { ProductGallery } from '../../components/product-gallery';
import { ReviewSection } from '../../components/review-section';
import { formatPrice } from '../../products';
import { getProduct } from '../../lib/catalog';
import { checkoutReady } from '../../lib/server';
import { hasDatabase } from '../../lib/supabase';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : { title: 'Piece not found' };
}
export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  return <main id="main-content" className="product-page">
    <Link className="back-link" href="/">← Back to the collection</Link>
    <div className="product-detail-grid"><ProductGallery product={product} />
      <section className="product-info" aria-labelledby="product-title">
        <p className="eyebrow">{product.category} · Handmade in Denver</p>
        <h1 id="product-title">{product.name}</h1><p className="detail-price">{formatPrice(product.price_cents)}</p>
        <p className="detail-description">{product.description}</p>
        {product.condition_note && <p className="condition-notice"><strong>Please note</strong>{product.condition_note}</p>}
        <dl className="piece-specs"><div><dt>Material</dt><dd>{product.material}</dd></div>
          {product.weight_lbs !== null && <div><dt>Weight</dt><dd>{product.weight_lbs.toFixed(2)} lb</dd></div>}
          {product.dimensions && <div><dt>Dimensions</dt><dd>{product.dimensions}</dd></div>}
          {product.care && <div><dt>Care</dt><dd>{product.care}</dd></div>}
        </dl>
        <p className="handmade-note">Each piece is made by hand. Look through the photos to see its individual glaze and shape.</p>
        <CheckoutPanel product={product} enabled={checkoutReady()} />
      </section>
    </div><ReviewSection productSlug={product.slug} enabled={hasDatabase()} />
  </main>;
}
