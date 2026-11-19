import optimizedImages from "../lib/optimized-images.generated";

// Only generated local assets are rewritten. Unknown, newly imported, and remote
// images retain their original URL until the optimizer is run again.
export function imageVariants(src) {
  if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//"))
    return [];
  const path = src.split(/[?#]/, 1)[0];
  try {
    return (
      optimizedImages[decodeURIComponent(path)] || optimizedImages[path] || []
    );
  } catch {
    return optimizedImages[path] || [];
  }
}

export function optimizedImageUrl(src, largest = false) {
  const variants = imageVariants(src);
  return variants.length
    ? variants[largest ? variants.length - 1 : 0].src
    : src;
}

export default function OptimizedImage({
  src,
  sizes = "(max-width: 760px) 50vw, 25vw",
  loading = "lazy",
  onError,
  ...props
}) {
  const variants = imageVariants(src);
  const srcSet = variants
    .map((item) => `${item.src} ${item.width}w`)
    .join(", ");
  return (
    <img
      {...props}
      src={variants.length ? variants[variants.length - 1].src : src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      loading={loading}
      decoding="async"
      onError={(event) => {
        const image = event.currentTarget;
        if (variants.length && image.dataset.originalFallback !== src) {
          image.dataset.originalFallback = src;
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          image.src = src;
        } else if (onError) onError(event);
      }}
    />
  );
}
