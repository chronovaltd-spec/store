# Chronova BD — realistic fabric-background product-photo prompt

## Why the earlier result looked staged

The earlier wording asked for a “luxury studio still-life” and “subtle depth” but did not explicitly forbid display plinths, stacked blocks, marble bases, or showroom staging. That left the image model room to add the platforms seen in image 1. The prompt also asked the model to preserve tiny dial text while regenerating the whole image; generative image models often redraw logos, numerals, and date windows inaccurately even when told not to.

For the intended look in **image-2.png**, use the real product photo as the subject reference and image-2 only as a style/composition reference. Ask for a background edit/composite—not a newly invented watch—and explicitly rule out display stands and pedestals.

## Copy-and-paste prompt

> **Image roles:** Image A is the actual product and the only source of truth for the watch. Image B, if attached, is a visual reference for the warm textured-fabric background, close editorial framing, diagonal composition and soft natural light only. Do not copy the watch or any product details from Image B.
>
> Edit Image A into one photorealistic, premium e-commerce photograph. Keep the exact same physical watch from Image A: preserve its case shape and proportions, bezel, crown, dial, markers, hands, date window, strap, color, materials, and all visible markings. Do not redesign, replace, embellish or reinterpret any product feature. **Do not redraw, correct, invent or alter the logo, dial text, numerals or date. Keep the original watch pixels/details intact wherever possible; edit/composite the surrounding background rather than regenerating the watch. If exact product details cannot be preserved, leave the watch unchanged and only replace or refine the background.**
>
> Match the natural editorial mood of Image B: place the watch directly on a continuous warm ivory / sand-beige woven linen or fine natural fabric surface, with realistic visible weave, soft irregular folds and subtle texture. The fabric is both the surface beneath the watch and the background; it should fill the entire scene naturally. Photograph the watch at a close, slightly oblique angle, resting diagonally across the fabric, with soft warm window light from one side, gentle realistic contact shadows, restrained highlights and believable depth of field. Keep the materials and lighting photographic—not showroom-perfect or CGI. The watch is the clear hero and should remain sharp and recognizable.
>
> **Composition for the storefront:** one image only, portrait 4:5 aspect ratio, 1600 × 2000 pixels or the closest available high-resolution equivalent. Keep the entire watch case and dial fully inside the frame with safe margins for the site thumbnail crop. A strap may run diagonally toward the frame edge, but do not cut off the case, crown or any important product detail. No text, price, badge, logo overlay, watermark, border, collage, grid or extra product.
>
> **Absolutely no** pedestal, plinth, marble slab, stacked display blocks, watch stand, showroom riser, product platform, display tray, ornate set, beige columns, artificial wall panels, hard geometric stage, props touching or covering the watch, extra watch, duplicate watch, floating watch, or dramatic CGI lighting. The watch must rest naturally on the fabric surface.

## Negative prompt (if supported)

> pedestal, plinth, marble base, stacked blocks, platform, riser, watch stand, display tray, showroom display, beige columns, wall panels, hard geometric set, artificial stage, CGI, 3D render, plastic look, changed watch, different case, altered bezel, altered dial, changed markers, changed hands, invented date, incorrect logo, misspelled brand, fake text, extra subdials, extra buttons, wrong strap, wrong color, distorted proportions, melted details, floating object, extra watch, duplicate product, cropped case, cropped crown, glare hiding the dial, harsh flash, oversaturation, collage, grid, caption, price, badge, watermark, border.

## For a wide editorial image

Image-2 is a wide landscape composition. If you are generating a wide hero/editorial image rather than a shop-card image, replace the output line above with: **“one landscape 3:2 image, 1800 × 1200 pixels; retain the same linen surface and diagonal close-up composition, and keep the full watch case visible.”** Use 4:5 for the storefront product thumbnail; use 3:2 only where the page has a wide image frame.

## Important accuracy check

- Upload the actual, unedited product photo as Image A for each watch. Use image-2 only as a style reference, never as a product reference.
- Image generation can still change small text and geometry. Compare the result with the real watch before publishing. If the logo/date/dial is not exact, use a conventional photo editor to mask the original watch over the generated fabric background instead of asking the model to redraw it.
- Keep the source photo separately and do not present an inaccurate AI recreation as documentary proof of the physical product, brand, authenticity or specifications.
