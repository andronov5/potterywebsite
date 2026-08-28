import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutPanel } from "../../components/checkout-panel";
import { ProductGallery } from "../../components/product-gallery";
import { ReviewSection } from "../../components/review-section";
import { formatPrice, getProduct, products } from "../../products";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Piece not found" };
  return {
    title: `${product.name} · Piece ${product.number}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main id="main-content" className="product-page">
      <Link className="back-link" href="/">← Back to all pieces</Link>

      <div className="product-detail-grid">
        <ProductGallery product={product} />
        <section className="product-info" aria-labelledby="product-title">
          <div className="piece-index">
            <span>Piece</span>
            <strong>{product.number}</strong>
          </div>
          <p className="eyebrow">One-of-a-kind pottery · Placeholder listing</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <p className="handmade-note">
            Every piece is shaped and glazed by hand, so small variations are
            part of its character. Replace this note with details about your work.
          </p>
          <dl className="piece-specs">
            <div><dt>Material</dt><dd>Insert material here</dd></div>
            <div><dt>Dimensions</dt><dd>Insert dimensions here</dd></div>
            <div><dt>Care</dt><dd>Insert care instructions here</dd></div>
            <div><dt>Availability</dt><dd>Ready to ship</dd></div>
          </dl>
        </section>
      </div>

      <CheckoutPanel price={product.price} productNumber={product.number} />
      <ReviewSection productSlug={product.slug} />
    </main>
  );
}
