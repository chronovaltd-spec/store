# Chronova BD storefront

React + Vite storefront. The approved starter catalogue is in `src/data/products.json`; staff-managed additions from the Django portal are merged from `src/data/products-admin.json`. Orders and contact messages are emailed through EmailJS. There is **no Google Sheets/Apps Script connection and no online order-tracking portal**; the owner handles order updates by replying to the customer’s email.

For the full CMD/PowerShell walkthrough and build-by-phase plan, see [`SETUP_AND_PHASES.md`](./SETUP_AND_PHASES.md).

## Run the site locally (Windows PowerShell)

```powershell
cd .\chronova-storefront
Copy-Item .env.example .env.local
npm install
npm run dev
```

Online orders and the contact form stay disabled until the EmailJS settings are filled in. Read [`EMAIL_SETUP.md`](./EMAIL_SETUP.md) for the short setup steps.

## Email provider status

EmailJS is the simple primary sender. If its request fails, the app can hand the message to the Cloudflare Pages Function at `/api/email-fallback`, which sends through Resend once configured. The function is included in `functions/api/email-fallback.js`; the Resend key must remain a Cloudflare server-side Secret, never a `VITE_` value. DNS verification, Cloudflare project secrets, rate limiting and a live delivery test are still required before enabling the fallback. Postmark is another transactional-email provider to consider.

## Product photos and launch checks

- The three new Chronova concept items use original, unbranded AI-generated studio images in `public/images/products/chronova-concept-*.jpg`. They are fictional design previews, not verified physical inventory.
- The three concept entries (CHR-031–CHR-033) have sample prices/specifications and are marked `previewOnly`. The popup and cart can be previewed, but checkout blocks these fictional items. Replace them with confirmed physical products, prices and stock before live sales.
- The earlier 30 catalogue rows are still provisional examples with photography/details awaiting confirmation. The seven reference watch photos are not used in the hero, catalogue or editorial pages.
- Shipping fees/zones, contact details, terms, returns, privacy wording and payment instructions also need owner approval.
- Email providers have quotas, rate limits and sending policies. This project does not claim free or unlimited email. Email-only mode has no shared order database, automatic status lookup or inventory sync.
- The source originals are preserved in `reference-originals/`; do not overwrite them when preparing photos.

## First-visit featured popup

The centered popup appears once per browser/device, on the first route visited, using a `localStorage` flag—not IP tracking or server-side identity. It presents up to three products marked `popupFeatured: true`, with an individual Add to bag action. The current three fictional concept items are preselected for layout testing; replace them with approved SKUs when ready. Staff can mark up to three products in Django’s product editor; manual catalogue export/rebuild/redeploy is still required.

## Editing the home-page banner slider

Use **Homepage banners** in the Django staff portal to add, edit, reorder, hide or delete up to four slides, including their copy, uploaded image, accessible image description, button labels and destinations. Export the **storefront ZIP**, extract it into the storefront project, then build and redeploy. This is a manual static-site update, not a live connection. The carousel timing remains unchanged.

## Updating products from the staff portal

1. Add or edit the product in the Chronova Django portal. Use one of the five storefront categories and fill in the Frontend details (badge, colors, movement, case and strap) as needed.
2. On **Products**, download the **JSON + photos ZIP**. The export contains active products plus explicit archive markers, an `inStock` boolean, and `popupFeatured` selection. Zero-stock products stay listed but cannot be added to the bag; exact stock, private cost, and reorder values are not exported.
3. Extract the ZIP into the `chronova-storefront` folder and allow it to replace `src/data/products-admin.json`; it also adds uploaded photos under `public/images/products/` where needed. Leave `src/data/products.json` unchanged.
4. Build and redeploy the site. The storefront merges the admin catalogue automatically by product ID (SKU): matching IDs update starter items, new IDs are added, and archived IDs are removed from the visible catalogue.

The separate **Download JSON** action provides the same admin-only array without the photo pack. This is still a static-site update—not live synchronization—so a rebuild/redeploy is required after each catalogue export.

## Main files

- `src/data/products.json` — base catalogue and three fictional concept previews
- `src/data/products-admin.json` — staff-exported additions and overrides
- `src/data/homepage-slides.json` — default editable home-page banner content
- `public/images/products/chronova-concept-*.jpg` — original unbranded concept imagery
- `src/lib/services.js` — EmailJS order/contact messages and optional secure fallback URL
- `EMAIL_SETUP.md` — beginner email configuration steps
- `CHRONOVA_COLOR_REVIEW.html` — two palette directions; option A was selected and applied
- `PRODUCT_PHOTO_REVIEW.html` — real photo matching review
- `public/images/products/` — lightly adjusted real product photos
- `reference-concepts/` — unassigned AI concepts, not used by the storefront
