/**
 * Image upload validation for brand assets (logo + photography).
 * Returns localized error keys; callers translate via the i18n layer.
 */

export type UploadKind = 'logo' | 'photo';

export interface UploadConstraints {
  maxBytes: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  acceptMime: string[];
}

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraints> = {
  logo: {
    maxBytes: 2 * 1024 * 1024, // 2 MB
    minWidth: 256,
    minHeight: 256,
    maxWidth: 4096,
    maxHeight: 4096,
    acceptMime: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  },
  photo: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    minWidth: 800,
    minHeight: 600,
    maxWidth: 4096,
    maxHeight: 4096,
    acceptMime: ['image/png', 'image/jpeg', 'image/webp'],
  },
};

export type ValidationResult =
  | { ok: true; width?: number; height?: number }
  | {
      ok: false;
      code: 'invalid_type' | 'too_large' | 'too_small_dim' | 'too_large_dim' | 'unreadable';
      i18nKey: string;
      extras?: Record<string, string | number>;
    };

const readDimensions = (file: File): Promise<{ width: number; height: number } | null> => {
  // SVG has no raster dimensions — skip dimension checks for SVG.
  if (file.type === 'image/svg+xml') return Promise.resolve(null);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      cleanup();
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      cleanup();
      resolve(null);
    };
    img.src = url;
  });
};

export const validateImageUpload = async (
  file: File,
  kind: UploadKind
): Promise<ValidationResult> => {
  const c = UPLOAD_CONSTRAINTS[kind];

  if (!c.acceptMime.includes(file.type)) {
    return {
      ok: false,
      code: 'invalid_type',
      i18nKey: 'settings.branding.uploadInvalidType',
      extras: { formats: c.acceptMime.map((m) => m.split('/')[1].toUpperCase()).join(', ') },
    };
  }

  if (file.size > c.maxBytes) {
    return {
      ok: false,
      code: 'too_large',
      i18nKey: 'settings.branding.uploadTooLarge',
      extras: { max: `${Math.round(c.maxBytes / (1024 * 1024))}MB` },
    };
  }

  const dims = await readDimensions(file);

  // SVG: dims === null is OK (vector). Raster: null means unreadable.
  if (dims === null && file.type !== 'image/svg+xml') {
    return {
      ok: false,
      code: 'unreadable',
      i18nKey: 'settings.branding.uploadUnreadable',
    };
  }

  if (dims) {
    if (dims.width < c.minWidth || dims.height < c.minHeight) {
      return {
        ok: false,
        code: 'too_small_dim',
        i18nKey: 'settings.branding.uploadDimensionsTooSmall',
        extras: { min: `${c.minWidth}×${c.minHeight}`, actual: `${dims.width}×${dims.height}` },
      };
    }
    if (dims.width > c.maxWidth || dims.height > c.maxHeight) {
      return {
        ok: false,
        code: 'too_large_dim',
        i18nKey: 'settings.branding.uploadDimensionsTooLarge',
        extras: { max: `${c.maxWidth}×${c.maxHeight}`, actual: `${dims.width}×${dims.height}` },
      };
    }
  }

  return { ok: true, width: dims?.width, height: dims?.height };
};

export const formatAcceptAttr = (kind: UploadKind): string =>
  UPLOAD_CONSTRAINTS[kind].acceptMime.join(',');
