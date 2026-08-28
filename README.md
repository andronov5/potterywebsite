# Pottery Shop

A distinctive pastel pottery storefront built around a glaze-test notebook visual style. The shop avoids generic gradients and rounded card layouts in favor of flat color fields, ink-like borders, offset print shadows, editorial typography, and asymmetric product blocks.

## What works

- The homepage is the full seven-product catalog.
- Every product opens on its own URL with a three-image gallery.
- Each listing has its exact placeholder price, quantity controls, and a realistic demo checkout.
- The checkout validates its fields and shows a demo confirmation without sending, saving, or charging anything.
- Visitors can submit star ratings and reviews; during this prototype phase, reviews are stored in that visitor's browser.
- A separate About the Potter page is ready for a real portrait and biography.
- The layout is responsive and keyboard accessible.

## Replace the placeholders

Product names, descriptions, prices, and photo paths live in `app/products.ts`. The temporary product images live in `public/placeholders/`. The studio name is in `app/layout.tsx`, and the potter biography is in `app/about/page.tsx`.

## Run locally

```bash
npm install
npm run dev
```

## Before taking real payments

The current checkout is intentionally a non-live demonstration. Connect a payment provider such as Stripe or Square and use a server-side order flow before accepting customer information or payments. Shared public reviews will also need a database and moderation controls; the current prototype stores reviews only in the browser that submitted them.
