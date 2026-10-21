/**
 * Small, framework-free helpers shared by the image upload / edit flows.
 * Kept free of Angular imports so they can be unit-tested in isolation.
 */

export const ALLOWED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (same limit the backend /images/temp route uses)

/** Returns a human-readable problem, or null when the file is acceptable. */
export function validateImageFile(file: { type: string; size: number } | null | undefined): string | null {
  if (!file) return 'No file selected.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please choose a JPEG, PNG or WebP image.';
  }
  if (file.size <= 0) return 'The selected file is empty.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`;
  }
  return null;
}

/**
 * The one image-file naming convention used by the app:  "<name> <flavor>.webp"
 * This is exactly what ImageService.getProductUrl() builds when displaying a product,
 * and what the live Add New flow already stored in `image_url`.
 * Path separators and control characters are replaced so the name is a safe single file name.
 */
export function buildProductImageName(productName: string, productFlavor: string): string {
  const clean = (s: string) =>
    String(s ?? '')
      .replace(/[\\/\u0000-\u001f]/g, '-')
      .trim();
  return `${clean(productName)} ${clean(productFlavor)}.webp`;
}

/**
 * Re-encodes any browser-decodable image as WebP so the bytes match the ".webp" file name.
 * Rejects (never silently mislabels) if the browser cannot decode or encode the image.
 */
export async function toWebpBlob(file: Blob, quality = 0.9): Promise<Blob> {
  if (file.type === 'image/webp') return file;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') {
      throw new Error('This browser could not convert the image to WebP.');
    }
    return blob;
  } finally {
    bitmap.close();
  }
}
