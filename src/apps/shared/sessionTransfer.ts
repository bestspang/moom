/**
 * Cross-surface session transfer utilities.
 *
 * When navigating between admin.moom.fit and member.moom.fit,
 * localStorage (and therefore the Supabase session) is per-origin.
 * This module passes tokens via URL hash fragments so the target
 * domain can restore the session without re-login.
 *
 * Security notes:
 * - Hash fragments are never sent to the server.
 * - Tokens are consumed and cleared immediately on load.
 * - Only used between known *.moom.fit domains.
 */

import { supabase } from '@/integrations/supabase/client';
import { isCustomDomain } from './hostname';

/**
 * Build a cross-surface URL that includes session tokens in the hash.
 * Only appends tokens on custom domains (production).
 * Falls back to the plain URL if no session exists.
 */
export async function buildSessionTransferUrl(targetUrl: string): Promise<string> {
  if (!isCustomDomain()) return targetUrl;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session?.refresh_token) return targetUrl;

    const url = new URL(targetUrl);
    // Encode tokens in hash fragment (never sent to server)
    url.hash = `access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
    return url.toString();
  } catch {
    return targetUrl;
  }
}

/**
 * Check the URL hash for transferred session tokens.
 * If found, restore the session and clear the hash immediately.
 * Call this BEFORE supabase.auth.getSession() in app init.
 */
export async function consumeSessionFromUrl(): Promise<boolean> {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=') || !hash.includes('refresh_token=')) {
    return false;
  }

  try {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) return false;

    // Clear hash immediately for security
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[SessionTransfer] Failed to restore session:', error.message);
      return false;
    }

    console.log('[SessionTransfer] Session restored successfully');
    return true;
  } catch (err) {
    console.error('[SessionTransfer] Error consuming session:', err);
    // Clear hash even on error
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return false;
  }
}
