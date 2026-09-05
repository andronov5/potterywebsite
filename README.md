# Pottery by Natalie

A Next.js storefront for Natalie’s handmade ceramics in Denver. The real collection contains eight products and 12 product photos, plus Natalie’s portrait. The supplied images are in `public/products/` and `public/studio/` with descriptive filenames. All nine original JPEG uploads are copied unchanged; the three HEICs are converted to full-resolution JPEGs. Product galleries show the complete frame and open an enlarged view.

## What is ready

- Responsive collection and individual product pages, with each photo matched to the correct piece.
- Natalie’s biography, portrait, custom-request guidance, and About-page contact section.
- `/admin`: email/password studio login, password reset, product creation/editing, photo uploads, cover selection, drafts/publishing, pricing and stock, contact inbox, order statuses, review moderation, public email and portrait settings.
- Durable products, messages, reviews, and images through Supabase; all writes are protected by database policies or server-side authorization.
- Hosted Stripe Checkout, server-owned prices, atomic inventory reservations, verified/idempotent payment webhooks, and a payment status page. Card details never enter this website.
- The Orders tab can sync held checkouts against Stripe to recover interrupted session creation or missed webhooks.

## Current launch status

**Login, contact submissions, persistent editing, and payments require account setup below. They are not live merely because this code is in GitHub.**

Until Supabase is configured, the shop reads the supplied collection from `app/initial-products.json`, the studio explains the setup requirement, and checkout/contact submission are disabled. With Supabase configured, the database becomes authoritative; database failures show unavailable states rather than stale purchaseable fallback data.

The supplied prices are saved in the collection and database seed: trinket tray $10; cream-and-green slow feeder $15; amber and dark glaze slow feeders $25 each; garlic grater $10; matcha bowl $30; matcha bowl and whisk holder $40; citrus juicer $15. Unconfirmed inventory starts at 0, and the garlic grater has 2 units per Natalie’s message. Confirm stock before opening sales. The browsing preview displays prices without labeling unconfirmed stock as sold out. Extra views of a piece do not create extra products. The cream-and-green feeder discloses slight damage at the bottom. The trinket tray has no invented dishwasher/microwave claim.

## One-time setup

The full shop needs a normal Next.js server host. The GitHub Pages collection preview described below has no server, payments, login, or form submissions.

1. Create or select a Supabase project for this shop.
2. Run `supabase/schema.sql` once in its SQL editor, then `supabase/seed.sql`. The seed is safe to repeat and does not overwrite Natalie’s edits. Do not rerun the schema file over existing tables; use reviewed migrations for future schema changes.
3. In Supabase Authentication, disable public signups. Privately add each approved studio owner's lowercase email to `private.studio_admin_emails` in Supabase, then invite that email through the Auth dashboard or Admin API. Use the live `/admin/reset-password` URL as the invitation redirect. The database grants studio membership only after the allowlisted email is verified. Do not commit the email allowlist or account credentials to GitHub.

   To permanently revoke access, remove both the private email entry and the corresponding `public.admin_users` row; otherwise a later email verification update could grant membership again. An authenticated account without membership cannot access the studio or edit the shop.
4. Set the Supabase Site URL to the live site origin and allow the exact `https://YOUR-DOMAIN/admin/reset-password` redirect. Configure an email sender in Supabase for production password-reset and invitation delivery. Password setup accepts the PKCE recovery flow and standard invitation/recovery fragments, validates the resulting user, and then allows a password change. Invalid links cannot fall back to another signed-in account.
5. Copy `.env.example` to `.env.local` for local development. In the production host's environment settings set the same keys. Use the Supabase project URL, modern publishable key, and private service-role key. Rebuild/redeploy after changing the `NEXT_PUBLIC_` keys, which are embedded at build time. Keep secrets out of GitHub. The server validates Auth cookies and database membership before rendering `/admin`; `/admin/login` and `/admin/reset-password` are public entry routes. Password setup remains reachable with an existing session and on reload.
6. Open `/admin`, sign in, confirm all prices and stock counts, and add Natalie’s public contact email if desired. The contact form saves to the Messages tab even if the public email is blank; it does not send notification emails. Natalie replies using the email link in each message.
7. Complete the Stripe setup below before enabling checkout.

## Netlify hosting

The full application is deployed at **https://pottery-by-natalie.netlify.app/**. The Netlify project is linked to this repository and automatically builds `main`. Production is public; non-production previews require Netlify team login. The first studio account still needs its invitation. Contact submissions and payments require the private server settings described below.

Import this GitHub repository into the shop owner's Netlify account and deploy `main`. The root `netlify.toml` selects `npm run build`, `.next`, and Node 22. Keep the repository base directory empty. Netlify automatically supplies its Next.js adapter; do not use the Pages export command or a static `out` directory for the full app.

Set the Supabase values and exact Netlify HTTPS origin from `.env.example` in Netlify's environment settings. Public values need build access; the private service-role key needs server/function access. Leave `CHECKOUT_ENABLED=false` until Stripe setup is complete. Never put a private key in `netlify.toml` or a `NEXT_PUBLIC_` variable. Add the exact password setup redirect in Supabase after the site URL is assigned.

The existing GitHub Pages workflow remains an independent browsing preview. Updating products in the full studio changes the Netlify shop immediately; it does not rewrite the Pages seed preview.

## Stripe setup and launch check

1. Use Natalie’s appropriate Stripe business account and complete Stripe’s account requirements. Start with test-mode credentials. Configure a US shipping rate in Stripe; the initial checkout supports US shipping only. Set `STRIPE_SHIPPING_RATE_ID` to that rate’s ID.
2. Set `STRIPE_SECRET_KEY` and the exact HTTPS `SITE_URL`. Configure a Stripe webhook endpoint at `https://YOUR-DOMAIN/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.expired`; set its signing secret as `STRIPE_WEBHOOK_SECRET`.
3. Explicitly choose the tax configuration. Set `STRIPE_AUTOMATIC_TAX=true` only after configuring Stripe Tax as intended; otherwise it stays false. Shipping and any configured tax are itemized on Stripe’s hosted checkout. Refund/return and fulfillment policies still need Natalie’s business decisions; no policy was invented.
4. Confirm a product has a real price and stock. In a **test deployment using test keys**, set `CHECKOUT_ENABLED=true`, rebuild/deploy, complete a Stripe test payment, and verify: the order becomes paid, stock decreases once, a repeat webhook does not decrease it again, and a second buyer cannot buy an already reserved last piece.
5. Test a checkout that expires and confirm its hold is released. Run **Orders → Sync with Stripe** for an interrupted or missed checkout event. It retains ambiguous recent holds; a no-session hold is released only after the 24-hour reconciliation window and a complete Stripe session search. A confirmed Stripe validation rejection can release a pre-creation hold immediately.
6. Switch to the live key, live shipping-rate ID, and live webhook secret only after that check. Rebuild/redeploy and verify the live webhook is enabled. `CHECKOUT_ENABLED=false` closes new purchases immediately after redeployment without interfering with webhook fulfillment.

Each checkout purchases one product with quantity bounded by stock. The SQL transaction serializes reservations, and immutable reservation snapshots supply prices to Stripe. Inventory remains reserved through checkout until payment or Stripe-confirmed expiration. Cancel navigation does not cancel a Stripe session. The return URL never serves as proof of payment. Admin saves use optimistic concurrency to avoid restoring stock from a stale editing form.

Stripe stores the payment and delivery details. The studio stores the order identifier, purchased product/quantity, total, status, and customer email. Fulfillment and refunds are managed in Stripe; changing local stock does not issue a refund.

## Natalie’s everyday workflow

1. Follow **Studio login** in the website footer and sign in.
2. Choose **Add a product**, enter its details, price, and unsold stock, then upload JPG/PNG/WebP photos (up to 12 per product; 15 MB each). Use **Make cover** to choose the shop photo.
3. Leave **Published in the shop** unchecked while preparing it; check it and save when it is ready. There is no ten-product limit.
4. Edit a listing to change details or hide it. Set stock to zero when sold outside the website. If stock changed while you were editing, cancel/reopen the listing and apply your edit to the current version.
5. Read **Messages**, review **Orders**, approve customer **Reviews**, and change your contact email or portrait in **Studio details**.

The initial repository photos remain in GitHub. Photos that Natalie adds later are saved to the persistent Supabase image bucket and appear on the site without a code deployment. They do not need a new GitHub commit. Unlinking an image from a product leaves its file in the bucket, avoiding accidental destruction of a photo used elsewhere.

## Run locally

```sh
npm ci
cp .env.example .env.local
npm run dev
```

For the unconfigured catalog only, environment values may stay empty. For server features, use the configured Supabase project and test Stripe keys. The production build is `npm run build`. Keep existing production hosting configured as a Node/Next.js application.

## GitHub Pages collection preview

The website preview is at **https://andronov5.github.io/potterywebsite/**. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. The `Publish pottery website` workflow builds and publishes the collection whenever `main` changes; it can also be run manually from Actions.

`npm run build:pages` exports the homepage, all published seed product pages, About page, and a studio notice into `pages-dist/`. Photos, galleries, styles, and links use the `/potterywebsite` base path. This output is ignored by git and uploaded as a Pages artifact; GitHub serves the built website instead of the README.

The script stages an isolated copy outside the repository and never changes the full application. It excludes API and payment-return routes, reads only the supplied product catalog, and keeps checkout and contact submissions disabled. It never copies environment files and removes commerce/database configuration from the build environment. If a transformed route changes shape, the script fails with a named file rather than silently publishing an incomplete build.

GitHub Pages is for this browsing preview. Launch the full shop on the server host from the setup section; do not collect login or payment details through Pages. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) and [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports) explain the hosting constraints.

## Verification performed

- Next.js production build and TypeScript check.
- Database schema executed in PostgreSQL-compatible PGlite with 52 focused authorization and inventory checks: anonymous/non-admin denial, admin save, stale-save rejection, last-item reservation, idempotent payment updates, amount/session mismatch rejection, and expiration.
- Product/photo count, local asset references, and supplied specs cross-checked against Natalie’s messages. No browser visual test or live provider transaction has been completed; those require the configured accounts.

## Technical references

- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
