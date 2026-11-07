// Meta Pixel ID from the client's existing Chronova dataset.
// Pixel IDs are public identifiers; never place a Conversions API token here.
const META_PIXEL_ID = '2253099345268172';
const CONSENT_KEY = 'chronova.marketing-consent.v1';
const CONSENT_EVENT = 'chronova:consent-change';

let initialized = false;
let lastPageViewPath = null;
//Merge Conflict
export function getMarketingConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function ensurePixel() {
  if (getMarketingConsent() !== 'granted' || typeof window === 'undefined') return false;

  if (!window.fbq) {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  if (!initialized) {
    window.fbq('init', META_PIXEL_ID);
    initialized = true;
  } else {
    window.fbq('consent', 'grant');
  }
  return true;
}

export function setMarketingConsent(value) {
  if (value !== 'granted' && value !== 'denied') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}

  if (value === 'denied') {
    if (typeof window !== 'undefined' && window.fbq) window.fbq('consent', 'revoke');
    lastPageViewPath = null;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  }
}

export function trackMetaPageView(path) {
  if (!ensurePixel()) return false;
  const normalizedPath = path || window.location.pathname;
  if (normalizedPath === lastPageViewPath) return true;
  window.fbq('track', 'PageView');
  lastPageViewPath = normalizedPath;
  return true;
}

export function trackMetaEvent(eventName, parameters = {}) {
  if (!ensurePixel()) return false;
  window.fbq('track', eventName, parameters);
  return true;
}
