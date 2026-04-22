// Shared typed Supabase client factory for all edge functions.
// PURPOSE: Avoid TS2339 'never' inference when using `ReturnType<typeof createClient>`.
// USAGE:
//   import { createDb, getCorsHeaders, type Db } from "../_shared/db.ts";
//   const db: Db = createDb();
//
// DO NOT inline `createClient` directly in edge functions — always go through this factory.

import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.93.3";
import type { Database } from "./database.types.ts";

export type Db = SupabaseClient<Database>;

/** Create a service-role typed client (bypasses RLS). Use with caution. */
export function createDb(): Db {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient<Database>(url, key);
}

/** Create a user-scoped typed client (respects RLS via the caller's JWT). */
export function createUserDb(authHeader: string): Db {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

// ---------- CORS ----------

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

/** Standard CORS headers reflecting the request origin if allow-listed. */
export function getCorsHeaders(req: Request, extraAllowedHeaders = ""): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  const baseHeaders =
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": extraAllowedHeaders
      ? `${baseHeaders}, ${extraAllowedHeaders}`
      : baseHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/** JSON response helper that includes CORS headers. */
export function jsonResponse(
  body: unknown,
  init: { status?: number; cors: Record<string, string> }
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...init.cors, "Content-Type": "application/json" },
  });
}
