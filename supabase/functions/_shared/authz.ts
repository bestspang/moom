import type { Database } from "./database.types.ts";
import type { Db } from "./db.ts";

export type AccessLevel = Database["public"]["Enums"]["access_level"];

const STAFF_ROLES = new Set(["front_desk", "trainer", "freelance_trainer", "admin", "owner"]);

function getBearerToken(authHeader: string | null): string | null {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function hasInternalServiceRoleAuth(authHeader: string | null): boolean {
  const token = getBearerToken(authHeader);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return Boolean(token && serviceRoleKey && token === serviceRoleKey);
}

export async function getOwnedMemberId(db: Db, userId: string): Promise<string | null> {
  const { data, error } = await db.rpc("get_my_member_id", { _user_id: userId });
  if (error) {
    console.warn("[authz] get_my_member_id failed:", error);
    return null;
  }
  return data ?? null;
}

export async function hasMinAccessLevel(
  db: Db,
  userId: string,
  minLevel: AccessLevel,
): Promise<boolean> {
  const { data, error } = await db.rpc("has_min_access_level", {
    _user_id: userId,
    _min_level: minLevel,
  });
  if (error) {
    console.warn("[authz] has_min_access_level failed:", error);
    return false;
  }
  return Boolean(data);
}

export async function hasStaffAccessLevel(
  db: Db,
  userId: string,
  minLevel: AccessLevel,
): Promise<boolean> {
  const { data: roles, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.warn("[authz] user_roles lookup failed:", error);
    return false;
  }

  const hasStaffRole = (roles ?? []).some((row) => STAFF_ROLES.has(row.role));
  return hasStaffRole ? hasMinAccessLevel(db, userId, minLevel) : false;
}

export async function canAccessMember(
  db: Db,
  userId: string,
  memberId: string,
  minStaffLevel: AccessLevel = "level_1_minimum",
): Promise<boolean> {
  const [ownedMemberId, hasStaffAccess] = await Promise.all([
    getOwnedMemberId(db, userId),
    hasStaffAccessLevel(db, userId, minStaffLevel),
  ]);

  return ownedMemberId === memberId || hasStaffAccess;
}
