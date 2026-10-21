# Editing storefront information pages

The storefront is intentionally static: editing the Django portal does not change the public Cloudflare Pages site until you export, rebuild, and redeploy it.

## FAQ

Open `src/App.jsx` and find `function FAQ()`. The `items` array contains the question-and-answer pairs. Edit the text between each pair of quotes, keeping the array brackets and commas intact.

## Terms, delivery, returns, refunds, and privacy

In the same file, find `function Policy({kind})`. Its `contents` object contains three page groups:

- `shipping` — the Delivery, Returns & Refunds page (`/shipping-returns`)
- `terms` — Terms & Conditions (`/terms`)
- `privacy` — Privacy Policy (`/privacy`)

Each group has a `title`, `lead`, and `sections` array. Update those strings with owner-approved wording. The current copy is a draft and should be reviewed before accepting live orders; it is not legal advice.

## Publish

After editing, run `npm run build` in the `chronova-storefront` folder. If the build succeeds, use the existing Cloudflare Pages deployment workflow. These page edits are not synchronized to the Django portal.

## Reviews

Customer reviews are moderated in the Django staff portal. Export approved reviews from **Customer reviews → Export approved reviews**, extract the ZIP into this storefront project, then rebuild and redeploy. The export deliberately omits customer addresses, WhatsApp numbers, order references, and private review tokens.
