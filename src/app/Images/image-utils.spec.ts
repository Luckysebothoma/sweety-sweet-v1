import { MAX_IMAGE_BYTES, buildProductImageName, toWebpBlob, validateImageFile } from './image-utils';

describe('image-utils', () => {
  describe('validateImageFile', () => {
    it('rejects a missing file', () => {
      expect(validateImageFile(null)).toBeTruthy();
    });
    it('accepts jpeg, png and webp', () => {
      for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
        expect(validateImageFile({ type, size: 1024 })).toBeNull();
      }
    });
    it('rejects unsupported types', () => {
      expect(validateImageFile({ type: 'image/gif', size: 10 })).toContain('Unsupported');
      expect(validateImageFile({ type: 'application/pdf', size: 10 })).toContain('Unsupported');
    });
    it('rejects empty and oversized files', () => {
      expect(validateImageFile({ type: 'image/png', size: 0 })).toContain('empty');
      expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toContain('too large');
    });
    it('accepts exactly the size limit', () => {
      expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES })).toBeNull();
    });
  });

  describe('buildProductImageName', () => {
    it('builds "<name> <flavor>.webp"', () => {
      expect(buildProductImageName('Lollipop', 'Cherry')).toBe('Lollipop Cherry.webp');
    });
    it('trims whitespace', () => {
      expect(buildProductImageName('  Gum ', ' Mint  ')).toBe('Gum Mint.webp');
    });
    it('neutralises path separators', () => {
      expect(buildProductImageName('a/b', 'c\\d')).toBe('a-b c-d.webp');
    });
  });

  describe('toWebpBlob (browser)', () => {
    async function pngBlob(): Promise<Blob> {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      c.getContext('2d')!.fillRect(0, 0, 4, 4);
      return new Promise<Blob>((res) => c.toBlob((b) => res(b as Blob), 'image/png'));
    }

    it('re-encodes a PNG as image/webp', async () => {
      const out = await toWebpBlob(await pngBlob());
      expect(out.type).toBe('image/webp');
      expect(out.size).toBeGreaterThan(0);
    });

    it('returns an existing WebP untouched', async () => {
      const webp = new Blob(['x'], { type: 'image/webp' });
      expect(await toWebpBlob(webp)).toBe(webp);
    });

    it('rejects bytes that are not an image (never mislabels)', async () => {
      await expectAsync(toWebpBlob(new Blob(['not an image'], { type: 'image/png' }))).toBeRejected();
    });
  });
});
