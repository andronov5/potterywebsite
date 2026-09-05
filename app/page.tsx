import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from './products';
import { getProducts } from './lib/catalog';
import { brand } from './lib/brand';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = (await getProducts()).filter(product => product.stock > 0);
  return <main id="main-content" className="catalog-page">
    <section className="catalog-intro" aria-labelledby="shop-heading">
      <h1 id="shop-heading">{brand.tagline}</h1>
    </section>
    <div className="collection-heading"><h2>The collection</h2><span>{products.length} designs</span></div>
    {products.length === 0 && <p className="notice">The next collection is in the making. Come back soon.</p>}
    <section className="product-grid" aria-label="All pottery products">
      {products.map((product, index) => <article className={`product-card tone-${product.tone}`} key={product.slug}>
        <Link className="product-link" href={`/product/${product.slug}`}>
          <span className="product-photo-wrap"><span className="frame-image"><Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="(max-width: 620px) 90vw, (max-width: 1000px) 45vw, 30vw" priority={index < 3} /></span></span>
          <span className="product-copy"><span className="eyebrow">{product.category}</span><strong>{product.name}</strong>
            <span className="card-details">{product.weight_lbs} lb{product.dimensions ? ` · ${product.dimensions}` : ''}</span>
            {product.condition_note && <span className="condition-tag">Small imperfection · see details</span>}
            <span className="card-bottom"><b>{formatPrice(product.price_cents)}</b><span>View piece ↗</span></span>
          </span>
        </Link>
      </article>)}
    </section>
  </main>;
}
