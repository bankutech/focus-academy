/**
 * Focus Academy - Base64 Profile Image Processing Pipeline for Firestore
 *
 * Implements client-side square center-crop, resizing, compression,
 * and conservative document-size budget guarding to safely store
 * avatar images directly in Cloud Firestore documents without requiring
 * Firebase Storage buckets.
 *
 * Firestore Document Budget:
 * - Max Firestore Document Limit: 1,048,576 bytes (1 MiB)
 * - Avatar Base64 Budget: <= 46,080 bytes (~45 KB)
 * - Headroom for Profile & System Metadata: > 1,000,000 bytes (~97% free)
 */

export const MAX_INPUT_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB max upload
export const MAX_AVATAR_BASE64_BYTES = 46080; // 45 KiB conservative Firestore budget
export const TARGET_AVATAR_DIMENSION = 128; // 128x128 px
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Calculates approximate byte size of a Base64 data URL.
 * @param {string} dataUrl
 * @returns {number}
 */
export function getBase64ByteSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const commaIndex = dataUrl.indexOf(',');
  const base64String = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = (base64String.match(/=+$/) || [''])[0].length;
  return Math.floor((base64String.length * 3) / 4) - padding;
}

/**
 * Validates file upload before processing.
 * @param {File|Blob} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageUpload(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file to upload.' };
  }
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please choose a JPEG, PNG, or WebP picture.`
    };
  }
  if (file.size > MAX_INPUT_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `The selected file is too large (${sizeMb} MB). Maximum allowed upload size is 5 MB.`
    };
  }
  return { valid: true };
}

/**
 * Reads a File/Blob into an HTMLImageElement.
 * @param {File|Blob} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The image file appears to be corrupted or unreadable.'));
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes an avatar image: center-crops to square, resizes to avatar dimensions,
 * and compresses to JPEG data URL within Firestore size limits.
 *
 * @param {File|Blob} file
 * @param {Object} [options]
 * @param {number} [options.dimension=128]
 * @param {number} [options.maxBytes=46080]
 * @returns {Promise<{
 *   ok: boolean,
 *   dataUrl?: string,
 *   sizeBytes?: number,
 *   width?: number,
 *   height?: number,
 *   error?: string
 * }>}
 */
export async function processAvatarImage(file, options = {}) {
  const dimension = options.dimension || TARGET_AVATAR_DIMENSION;
  const maxBytes = options.maxBytes || MAX_AVATAR_BASE64_BYTES;

  const preValidation = validateImageUpload(file);
  if (!preValidation.valid) {
    return { ok: false, error: preValidation.error };
  }

  // Handle environment without DOM Canvas (e.g. headless tests)
  if (typeof document === 'undefined' || !document.createElement) {
    return {
      ok: false,
      error: 'Image processing canvas is not supported in this environment.'
    };
  }

  let img;
  try {
    img = await loadImageElement(file);
  } catch (err) {
    return { ok: false, error: err.message || 'Could not load image.' };
  }

  const canvas = document.createElement('canvas');
  canvas.width = dimension;
  canvas.height = dimension;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { ok: false, error: 'Canvas 2D context unavailable.' };
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Center crop calculations
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  if (!sw || !sh) {
    return { ok: false, error: 'Invalid image dimensions.' };
  }

  const minSide = Math.min(sw, sh);
  const sx = (sw - minSide) / 2;
  const sy = (sh - minSide) / 2;

  // Draw background fill (white for transparent PNGs)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dimension, dimension);

  // Draw cropped and scaled image
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, dimension, dimension);

  // First compression pass at 0.82 quality
  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let byteSize = getBase64ByteSize(dataUrl);

  // If still above byte budget, reduce quality in steps
  if (byteSize > maxBytes) {
    quality = 0.65;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    byteSize = getBase64ByteSize(dataUrl);
  }

  if (byteSize > maxBytes) {
    quality = 0.50;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    byteSize = getBase64ByteSize(dataUrl);
  }

  // Hard safety budget guard
  if (byteSize > maxBytes) {
    return {
      ok: false,
      error: `Processed avatar (${Math.round(byteSize / 1024)} KB) exceeded Firestore safe budget (${Math.round(maxBytes / 1024)} KB). Choose a simpler image.`
    };
  }

  return {
    ok: true,
    dataUrl,
    sizeBytes: byteSize,
    width: dimension,
    height: dimension,
    mimeType: 'image/jpeg'
  };
}
