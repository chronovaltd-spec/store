# Chronova BD — setup and build phases

This is the existing Chronova storefront project. These steps start it from a clean Windows machine; you do not need to create a new Vite project or copy code into a different folder.

## Phase 0 — Install the one prerequisite

Install the current **Node.js LTS** release from [nodejs.org](https://nodejs.org/). Then close and reopen Command Prompt or PowerShell and check:

```text
node --version
npm --version
```

Both commands should print a version number.

## Phase 1 — Extract and open the project

Download `chronova-storefront-source.zip` and use **one** of the command sets below. Change the download path if your browser saved the ZIP somewhere else.

### PowerShell

```powershell
$projectRoot = Join-Path $HOME 'Projects'
New-Item -ItemType Directory -Force -Path $projectRoot | Out-Null
Expand-Archive -LiteralPath (Join-Path $HOME 'Downloads\chronova-storefront-source.zip') -DestinationPath $projectRoot -Force
Set-Location (Join-Path $projectRoot 'chronova-storefront')
Copy-Item .env.example .env.local
```

### Command Prompt (CMD)

```bat
mkdir "%USERPROFILE%\Projects" 2>nul
tar -xf "%USERPROFILE%\Downloads\chronova-storefront-source.zip" -C "%USERPROFILE%\Projects"
cd /d "%USERPROFILE%\Projects\chronova-storefront"
copy .env.example .env.local
```

If the ZIP is already extracted, skip the extraction commands and `cd` into the extracted `chronova-storefront` folder.

## Phase 2 — Install packages and start the preview

Run these commands from inside the `chronova-storefront` folder:

```text
npm install
npm run dev
```

Keep the terminal window open. Vite prints the local preview address. Press **Ctrl+C** in the terminal to stop the preview.

## Phase 3 — Configure EmailJS when the store mailbox is ready

The `.env.local` file starts with blank EmailJS settings, so the order and contact email buttons stay disabled until they are configured. Follow [`EMAIL_SETUP.md`](./EMAIL_SETUP.md) to add the EmailJS service ID, template ID, public key and approved store email. Restart Vite after saving the file.

Cloudflare Pages is the selected host. A Resend Pages Function is included, but it is not active until you verify a sending domain, add Cloudflare server-side secrets, configure rate limiting, and test a real delivery. Never paste private keys into `.env.local` or a `VITE_` variable. Postmark is a possible alternative provider, also requiring a server-side token.

## Phase 4 — Confirm the catalogue before using real product listings

Open [`PRODUCT_PHOTO_REVIEW.html`](./PRODUCT_PHOTO_REVIEW.html). Send the exact watch model/name, approved BDT price, and matching filename for each product. Until that is confirmed, the real photos remain unmatched and the 30 catalogue entries remain unapproved sample data. The site will not invent photo-to-product matches.

## Phase 5 — Build a release

From the project folder:

```text
npm run build
```

If the build finishes successfully, test the production build locally with:

```text
npm run preview
```

Deploy the Vite build (`npm run build`, output `dist`) to the Cloudflare Pages project. Email delivery, product details, price, inventory, delivery fees and legal copy still need owner approval and real testing.

## Design phases in this project

1. **Foundation:** approved Heirloom Ivory palette (cream/off-white, muted gold, burgundy and navy); system sans-serif for body text and Georgia for editorial headings; no dark mode.
2. **Storefront pages:** clear, editorial hierarchy and real photography only where it is relevant. No AI-generated product photos are served by the site; unmatched product slots are labelled honestly.
3. **Purchase flow:** customer details, delivery/payment preference, order review and a final place-order action. Payment is not collected online.
4. **Email and contact:** EmailJS primary, with a Cloudflare Pages Function prepared to call Resend as a secure server-side fallback once configured. Postmark is an alternative provider to evaluate. This email-only version has no shared order database or online tracking page.
5. **Final release:** owner confirms products, prices, mapping, contact details, policies and delivery terms; email services and real inboxes are tested before taking orders.

Design reference pages were used for general principles—not copied layouts: focused sign-in/task hierarchy, clear content groupings, restrained photographic storytelling, careful typography, and meaningful interactions. The site keeps its own Chronova visual identity.
