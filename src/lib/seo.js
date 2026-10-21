import { useEffect } from 'react';

const SITE_URL = String(import.meta.env.VITE_SITE_URL || '').replace(/\/+$/, '');
const INDEXING_ENABLED = String(import.meta.env.VITE_INDEXING_ENABLED || '').toLowerCase() === 'true';

export function isSEOProduct(product) {
  const description = String(product?.description || '').trim();
  const images = [...(Array.isArray(product?.images) ? product.images : []), product?.image].filter(Boolean);
  const placeholderImage = images.some(image => /placeholder|concept|preview|sample/i.test(String(image)));
  return Boolean(
    product?.id && product?.name && description.length >= 50 && images.length && !placeholderImage && typeof product.inStock === 'boolean' &&
    !product.previewOnly && product.active !== false && Number(product.price) > 0 &&
    !/to be confirmed|will be confirmed|fictional|concept preview|confirm final|photo awaiting|details pending|sample product|test product/i.test(description)
  );
}

function setMeta(keyAttribute, key, content) {
  let element = document.head.querySelector(`meta[${keyAttribute}="${key}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(keyAttribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export function usePageSEO({ title, description, path, robots = 'index,follow', image = '/chronova-logo.webp', type = 'website', structuredData = null }) {
  const schemaText = structuredData ? JSON.stringify(structuredData) : '';
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const fullTitle = title ? `${title} | Chronova BD` : 'Chronova BD — Time, considered.';
    const canonicalPath = path || window.location.pathname;
    const canonicalUrl = SITE_URL ? new URL(canonicalPath, `${SITE_URL}/`).href : '';
    const imageUrl = SITE_URL && image ? new URL(image, `${SITE_URL}/`).href : '';
    document.title = fullTitle;
    setMeta('name', 'description', description || 'Thoughtfully selected watches from Chronova BD, with Bangladesh-wide delivery details confirmed by our team.');
    setMeta('name', 'robots', INDEXING_ENABLED ? robots : 'noindex,nofollow');
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Chronova BD');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description || 'Thoughtfully selected watches from Chronova BD.');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description || 'Thoughtfully selected watches from Chronova BD.');
    if (imageUrl) setMeta('name', 'twitter:image', imageUrl);
    setCanonical(canonicalUrl);

    let script = document.getElementById('chronova-jsonld');
    if (schemaText) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'chronova-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = schemaText;
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, robots, image, type, schemaText]);
}
