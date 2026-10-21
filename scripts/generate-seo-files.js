import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const env = { ...loadEnv("production", root, ""), ...process.env };
const indexingEnabled =
  String(env.VITE_INDEXING_ENABLED || "").toLowerCase() === "true";
const siteUrlInput = (env.VITE_SITE_URL || "").trim();

await mkdir(dist, { recursive: true });

async function setDocumentRobots(content) {
  const indexPath = path.join(dist, "index.html");
  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch {
    return;
  }
  const tag = `<meta name="robots" content="${content}" />`;
  const metaStart = html.indexOf('<meta name="robots"');
  if (metaStart >= 0) {
    const metaEnd = html.indexOf(">", metaStart);
    html = `${html.slice(0, metaStart)}${tag}${html.slice(metaEnd + 1)}`;
  } else {
    const headEnd = html.toLowerCase().indexOf("</head>");
    if (headEnd >= 0)
      html = `${html.slice(0, headEnd)}    ${tag}\n  ${html.slice(headEnd)}`;
  }
  await writeFile(indexPath, html, "utf8");
}

if (!indexingEnabled) {
  await setDocumentRobots("noindex,nofollow");
  await writeFile(
    path.join(dist, "robots.txt"),
    "User-agent: *\nDisallow: /\n",
    "utf8",
  );
  await rm(path.join(dist, "sitemap.xml"), { force: true });
  console.log(
    "SEO files: indexing is disabled. Generated robots.txt blocks crawling; no sitemap is published.",
  );
  process.exit(0);
}

if (!siteUrlInput) {
  throw new Error(
    "VITE_INDEXING_ENABLED=true requires VITE_SITE_URL (the final canonical HTTPS origin).",
  );
}

let siteUrl;
try {
  const parsed = new URL(siteUrlInput);
  if (
    parsed.protocol !== "https:" ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "Use only the final HTTPS origin, for example https://chronova.example (no path, query, or trailing route).",
    );
  }
  siteUrl = parsed.origin;
} catch (error) {
  throw new Error(`Invalid VITE_SITE_URL: ${error.message}`);
}

await setDocumentRobots("index,follow");

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const baseProducts = await readJson("src/data/products.json");
const staffProducts = await readJson("src/data/products-admin.json");
const products = new Map(baseProducts.map((product) => [product.id, product]));
for (const product of staffProducts) {
  if (product.active === false) products.delete(product.id);
  else products.set(product.id, { ...products.get(product.id), ...product });
}

const hasConfirmedContent = (product) => {
  const description = String(product.description || "").trim();
  const images = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
  ].filter(Boolean);
  const placeholderCopy =
    /to be confirmed|will be confirmed|fictional|concept preview|confirm final|photo awaiting|details pending|sample product|test product/i.test(
      description,
    );
  const placeholderImage = images.some((image) =>
    /placeholder|concept|preview|sample/i.test(String(image)),
  );
  return Boolean(
    product.id &&
    product.name &&
    description.length >= 50 &&
    !placeholderCopy &&
    images.length &&
    !placeholderImage &&
    typeof product.inStock === "boolean" &&
    !product.previewOnly &&
    product.active !== false &&
    Number(product.price) > 0,
  );
};
const indexableProducts = [...products.values()].filter(hasConfirmedContent);

const urls = [
  "/about",
  "/faq",
  "/contact",
  "/shipping-returns",
  "/privacy",
  "/terms",
];
if (indexableProducts.length) {
  urls.unshift("/", "/shop");
  const categories = [
    ...new Set(
      indexableProducts
        .map((product) => String(product.category || "").trim())
        .filter(Boolean),
    ),
  ];
  for (const category of categories)
    urls.push(`/collections/${encodeURIComponent(category.toLowerCase())}`);
  for (const product of indexableProducts)
    urls.push(`/product/${encodeURIComponent(product.id)}`);
}
const reviews = await readJson("src/data/reviews.json").catch(() => []);
if (
  Array.isArray(reviews) &&
  reviews.some((review) => review && review.approved !== false)
)
  urls.push("/reviews");

const xmlEscape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...new Set(urls)].map(
    (route) => `  <url><loc>${xmlEscape(siteUrl + route)}</loc></url>`,
  ),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${siteUrl}/sitemap.xml`,
  "",
].join("\n");

await writeFile(path.join(dist, "robots.txt"), robots, "utf8");
await writeFile(path.join(dist, "sitemap.xml"), sitemap, "utf8");
console.log(
  `SEO files: published sitemap with ${new Set(urls).size} public URLs for ${siteUrl}; ${indexableProducts.length} product URLs passed the confirmed-content filter.`,
);
if (!indexableProducts.length) {
  console.warn(
    "SEO notice: no product, shop, or home URLs were added because no active product currently passes the confirmed content/image filter.",
  );
}
