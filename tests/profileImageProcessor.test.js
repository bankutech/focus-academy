import { describe, it, expect } from 'vitest';
import {
  validateImageUpload,
  getBase64ByteSize,
  MAX_INPUT_FILE_SIZE,
  MAX_AVATAR_BASE64_BYTES,
  TARGET_AVATAR_DIMENSION,
  SUPPORTED_MIME_TYPES
} from '../src/utils/imageProcessor';

describe('Base64 Profile Image Processor & Firestore Budget Guard', () => {
  describe('File Validation', () => {
    it('accepts valid JPEG, PNG, and WebP files', () => {
      SUPPORTED_MIME_TYPES.forEach((type) => {
        const file = new File(['dummy content'], 'avatar.jpg', { type });
        const res = validateImageUpload(file);
        expect(res.valid).toBe(true);
      });
    });

    it('rejects unsupported file formats like PDF or GIF', () => {
      const pdf = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });
      const gif = new File(['GIF89a'], 'anim.gif', { type: 'image/gif' });
      expect(validateImageUpload(pdf).valid).toBe(false);
      expect(validateImageUpload(pdf).error).toContain('Unsupported image format');
      expect(validateImageUpload(gif).valid).toBe(false);
    });

    it('rejects files larger than 5 MB', () => {
      const hugeFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(hugeFile, 'size', { value: MAX_INPUT_FILE_SIZE + 1024 });
      const res = validateImageUpload(hugeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('too large');
    });

    it('rejects null or empty file selections', () => {
      expect(validateImageUpload(null).valid).toBe(false);
      expect(validateImageUpload(undefined).valid).toBe(false);
    });
  });

  describe('Base64 Size & Document Budget Calculations', () => {
    it('calculates the binary byte size from a Base64 data URL', () => {
      // 4 characters of base64 = 3 bytes
      const testData = 'data:image/jpeg;base64,' + 'AAAA'.repeat(100);
      const size = getBase64ByteSize(testData);
      expect(size).toBe(300);
    });

    it('enforces a safe avatar budget strictly below Firestore 1 MiB limit', () => {
      expect(MAX_AVATAR_BASE64_BYTES).toBeLessThan(50 * 1024); // < 50 KB
      // Leaves over 95% of document space available for other fields
      const remainingBytes = 1048576 - MAX_AVATAR_BASE64_BYTES;
      expect(remainingBytes).toBeGreaterThan(990000);
    });

    it('targets avatar dimensions suitable for crisp retina displays', () => {
      expect(TARGET_AVATAR_DIMENSION).toBe(128); // 128x128 for 64x64 or 48x48 display
    });
  });
});
