// Internal workspace sites can read the authenticated OpenAI user from the
// forwarded request headers:
//
// import { headers } from "next/headers";
//
// export default async function Home() {
//   const requestHeaders = await headers();
//   const email = requestHeaders.get("oai-authenticated-user-email");
//   const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
//   const fullName =
//     encodedFullName &&
//     requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
//       "percent-encoded-utf-8"
//       ? decodeURIComponent(encodedFullName)
//       : null;
//   const displayName = fullName ?? email;
//   // ...
// }

import Link from "next/link";
import { formatPrice, products } from "./products";

export default function Home() {
  return (
    <main id="main-content" className="catalog-page">
      <section className="catalog-intro" aria-labelledby="shop-heading">
        <div>
          <p className="eyebrow">Fresh from the kiln · Collection 001</p>
          <h1 id="shop-heading">Objects for everyday rituals.</h1>
        </div>
        <p className="intro-note">
          Seven handmade pieces are waiting here. Replace the temporary photos,
          names, and descriptions whenever you are ready.
        </p>
      </section>

      <section className="product-grid" aria-label="All pottery products">
        {products.map((product, index) => (
          <article
            className={`product-card tone-${product.tone}`}
            key={product.slug}
          >
            <Link className="product-link" href={`/product/${product.slug}`}>
              <span className="product-number" aria-hidden="true">
                {product.number}
              </span>
              <span className="product-photo-wrap">
                <img
                  src={product.images[0].src}
                  alt={product.images[0].alt}
                  width="1200"
                  height="1400"
                  loading={index > 2 ? "lazy" : "eager"}
                />
                <span className="photo-note">photo placeholder</span>
              </span>
              <span className="product-copy">
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.description}</small>
                </span>
                <b>{formatPrice(product.price)}</b>
              </span>
              <span className="view-piece">View piece <span aria-hidden="true">↗</span></span>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
