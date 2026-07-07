import { supabase } from '@/integrations/supabase/client';

// The slip-images bucket is private (since the 2026-05-18 privatization migration),
// so getPublicUrl() links are dead. Viewers must mint a short-lived signed URL at
// read time. slip_file_url may hold a legacy full public URL (from getPublicUrl before
// privatization) or a bucket-relative path (new uploads) — both resolve to the object path.

const BUCKET = 'slip-images';

/** Extract the bucket-relative object path from a stored slip_file_url. */
export function slipObjectPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const marker = `/${BUCKET}/`;
  const idx = stored.indexOf(marker);
  const path = idx !== -1 ? stored.slice(idx + marker.length) : stored;
  return path.replace(/^public\//, '') || null;
}

/**
 * Create a short-lived signed URL for a stored slip image. Returns null when there is
 * no image or signing fails (RLS: staff or the owning member — see the slip-images
 * storage read policy).
 */
export async function getSlipSignedUrl(
  stored: string | null | undefined,
  ttlSeconds = 3600,
): Promise<string | null> {
  const path = slipObjectPath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error) {
    console.error('[slipImages] createSignedUrl failed', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
