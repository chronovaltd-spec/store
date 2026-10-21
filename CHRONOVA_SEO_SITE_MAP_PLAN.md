# Chronova BD — site map and SEO launch plan

**Review date:** 18 October 2026  
**Goal:** Improve qualified search visibility in Bangladesh while accurately presenting Chronova as a polished, trustworthy watch retailer. Search placement and customer volume cannot be guaranteed; this plan builds eligibility, relevance, crawlability and trust without inventing product or business claims.

## Current technical/content audit

The current storefront has a generic document title and one site-wide description in `index.html`. The React routes do not currently define unique route-level titles/descriptions/canonicals, and the public folder has no `sitemap.xml` or `robots.txt`. Product pages are rendered by a client-side React SPA; this works for shoppers but is less ideal for product-search markup than putting product data in the initial HTML. Google's product documentation recommends product markup on individual product pages and says JavaScript-generated product markup can make shopping crawls less frequent/reliable.

The base catalogue still contains sample products with descriptions saying details will be confirmed, and the concept pieces are explicitly fictional previews. Those entries should not be marketed/indexed as real inventory or used for product offers, ratings, authenticity or warranty claims until the owner confirms the facts.

## Proposed public URL map

### Public pages to index after final content review

- `/` — Chronova BD home/brand landing page
- `/shop` — all confirmed, sellable watches
- `/collections/classic`
- `/collections/sport`
- `/collections/everyday`
- `/collections/digital`
- `/collections/couple`
- `/product/{approved-product-id}` — one useful, unique page per real approved watch
- `/about` — real company/curation story
- `/shipping-returns` — final accurate delivery/return policy
- `/faq` — concise answers to real customer questions
- `/contact` — confirmed public contact options
- `/reviews` — only genuine customer reviews that staff approved
- `/privacy` and `/terms` — owner-reviewed legal copy

Collection routes should only exist where useful products and unique explanatory copy exist. Do not make thin, duplicated location/category pages solely to target keywords.

### Keep out of the sitemap / normally noindex

- `/cart`, `/checkout`, `/order-confirmation/*`, `/wishlist`
- `/write-review?order=...&token=...` — private order-linked review invitations contain a customer-specific token; never list them in a public sitemap or search index
- Search/filter/sort combinations and query-string variants (canonicalize to the appropriate collection or shop URL)
- Any fictional preview-only, archived, or unapproved product page

## Technical SEO foundation to implement after domain selection

1. **Unique page metadata:** descriptive title, meta description, canonical URL, Open Graph/Twitter social-preview data and a single clear H1 for each indexable home, collection, product and information page. Titles/descriptions should reflect actual page content; Google can rewrite search titles/snippets.
2. **Crawlable routing:** preserve direct loading and refresh for product/category URLs on both chosen static hosts. Consider pre-rendering the key public pages/products at build time so product text, metadata and JSON-LD exist in initial HTML instead of depending only on client JavaScript.
3. **Sitemap and robots:** generate `sitemap.xml` using the confirmed production origin and only canonical/indexable routes and approved active products; include it in `robots.txt`. Submit the public sitemap in Google Search Console and Bing Webmaster Tools. A sitemap helps discovery/crawling; it does not guarantee indexing or rank.
4. **Structured data:** add truthful `Organization`/`WebSite`, `BreadcrumbList`, and one `Product`/`Offer` per confirmed product page. Product price, currency, availability, brand, model/GTIN where available, shipping and return information must match visible pages and actual business policy. Only add ratings from genuine approved reviews—never sample/test ratings. Validate with Google's Rich Results Test and URL Inspection.
5. **Image/search performance:** descriptive filenames and alt text for real product photography; compress responsive watch images; avoid indexable placeholders; keep mobile performance and Core Web Vitals under review.
6. **Search Console and measurement:** verify the final domain, submit sitemap, inspect key URLs, monitor indexing and Search Console queries/click-through rates. Configure privacy-conscious analytics only after owner approval and cookie/privacy review.

## Bangladesh search/content strategy

Use natural English and, if the business can support it, Bangla search phrasing. Start with useful, specific phrases such as “men's watches in Bangladesh,” “women's watches Bangladesh,” “classic watches in Sylhet,” and “watch delivery in Bangladesh,” but only target product/location terms that match real stock and genuine service areas. Do not claim “original/authentic,” warranty, premium materials, free delivery, or a specific delivery promise unless the owner can substantiate it.

Build helpful articles from real staff expertise—for example, watch movement basics, choosing a case size, caring for a watch in Bangladesh's humid climate, and how to select a gift watch. Each article should answer an actual customer question and link to relevant confirmed products. Avoid spun/AI filler pages and doorway pages.

For local discovery, claim and verify a Google Business Profile if eligible, keep business name/phone/service area/hours consistent everywhere, add real business/store imagery, and request honest reviews from actual customers without incentives. Do not publish a private home address unless the owner intends it to be public.

For shopping visibility, evaluate Google Merchant Center/free listings after the product catalogue, pricing, stock, shipping, returns and business identity are final. Product structured data and a feed can improve product-data understanding and eligibility for shopping features, but Google decides what appears.

## Suggested launch sequence

1. Approve the products and catalogue: remove sample/fictional entries from public sales, confirm names/models, photos, prices, stock, category, shipping, returns and warranty/authenticity wording.
2. Choose the final public domain and primary host (Cloudflare Pages or Vercel); enforce one canonical HTTPS hostname and redirect alternate hostnames.
3. Provide the real public business identity, contact details, service area, opening hours (if applicable), and approved legal/shipping policies.
4. Implement per-route metadata, canonical URLs, pre-rendering for public product pages, `robots.txt`, build-generated `sitemap.xml`, and truthful JSON-LD.
5. Verify the domain in Google Search Console and Bing Webmaster Tools; submit the sitemap; request inspection for the home, collection pages and several approved product pages.
6. Publish a small batch of genuinely useful watch guides, then maintain product data and availability through the existing manual export/rebuild/redeploy workflow.
7. Review Search Console monthly: indexed pages, search queries, clicks, impressions, click-through rate, errors and product rich-result enhancements. Improve titles/content based on real search data.

## Facts needed before generating production metadata/sitemap/schema

- Final HTTPS storefront domain (the sitemap and canonical links need the real origin).
- English only or English + Bangla content/search targeting.
- Approved live products: official display name, actual brand/model, accurate specs, unique SKU/GTIN if available, actual sale price, currency, stock state and genuine product images.
- Exact public business identity and public contact/service-area information. Confirm whether a physical address should be public.
- Approved delivery, return/refund, warranty and authenticity language.
- Confirmation of which reviews are genuine, customer-consented and approved for publication.

## Official references

- [Google SEO guide for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google product structured data overview](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Product snippets: requirements and technical guidance](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)
- [Google snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
