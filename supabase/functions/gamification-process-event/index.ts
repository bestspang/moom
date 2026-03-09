import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const ALLOWED_ORIGINS = [
  "https://admin.moom.fit",
  "https://member.moom.fit",
  "https://moom.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface GamificationEventRequest {
  event_type: string;
  member_id?: string;           // Admin DB member ID (direct calls)
  experience_user_id?: string;  // Experience DB auth.users.id (cross-project calls)
  idempotency_key: string;
  location_id?: string;
  branch_id?: string;           // Experience DB branch ID
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

// ---------- Identity Resolution ----------

async function resolveMemberId(
  db: ReturnType<typeof createClient>,
  body: GamificationEventRequest
): Promise<{ member_id: string; location_id: string | null } | null> {
  // Case 1: Direct member_id from Admin App
  if (body.member_id) {
    return { member_id: body.member_id, location_id: body.location_id ?? null };
  }

  // Case 2: experience_user_id from Experience App → resolve via identity_map
  if (body.experience_user_id) {
    const { data: mapping } = await db
      .from("identity_map")
      .select("admin_entity_id")
      .eq("entity_type", "member")
      .eq("experience_user_id", body.experience_user_id)
      .eq("is_verified", true)
      .maybeSingle();

    if (!mapping) return null;

    // Resolve branch → location if provided
    let locationId: string | null = body.location_id ?? null;
    if (!locationId && body.branch_id) {
      const { data: locMapping } = await db
        .from("identity_map")
        .select("admin_entity_id")
        .eq("entity_type", "location")
        .eq("experience_entity_id", body.branch_id)
        .maybeSingle();
      locationId = locMapping?.admin_entity_id ?? null;
    }

    return { member_id: mapping.admin_entity_id, location_id: locationId };
  }

  return null;
}

// ---------- Core Logic Helpers ----------

async function findMatchingRule(db: ReturnType<typeof createClient>, eventType: string) {
  const { data: rules } = await db
    .from("gamification_rules")
    .select("*")
    .eq("action_key", eventType)
    .eq("is_active", true)
    .limit(1);
  return rules?.[0] ?? null;
}

async function checkCooldown(
  db: ReturnType<typeof createClient>,
  memberId: string,
  eventType: string,
  cooldownMinutes: number
): Promise<boolean> {
  const threshold = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
  const { data } = await db
    .from("xp_ledger")
    .select("id")
    .eq("member_id", memberId)
    .eq("event_type", eventType)
    .gte("created_at", threshold)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function checkDailyLimit(
  db: ReturnType<typeof createClient>,
  memberId: string,
  eventType: string,
  maxPerDay: number
): Promise<{ exceeded: boolean; count: number }> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await db
    .from("xp_ledger")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("event_type", eventType)
    .gte("created_at", todayStart.toISOString());
  const c = count ?? 0;
  return { exceeded: c >= maxPerDay, count: c };
}

async function getOrCreateProfile(db: ReturnType<typeof createClient>, memberId: string) {
  let { data: profile } = await db
    .from("member_gamification_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error } = await db
      .from("member_gamification_profiles")
      .insert({ member_id: memberId, total_xp: 0, total_points: 0, available_points: 0, current_level: 1 })
      .select()
      .single();
    if (error) throw error;
    profile = newProfile;
  }
  return profile;
}

async function updateStreak(db: ReturnType<typeof createClient>, memberId: string, currentLongest: number) {
  const today = new Date().toISOString().split("T")[0];
  const { data: streak } = await db
    .from("streak_snapshots")
    .select("*")
    .eq("member_id", memberId)
    .eq("streak_type", "daily")
    .maybeSingle();

  let newStreak = 1;
  let newLongest = currentLongest;

  if (streak) {
    const lastDate = streak.last_activity_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastDate === today) {
      newStreak = streak.current_streak;
    } else if (lastDate === yesterday) {
      newStreak = streak.current_streak + 1;
    } else {
      // Check if streak was frozen (freeze_until covers the gap)
      const isFrozen = streak.freeze_until && streak.freeze_until >= today;
      if (isFrozen) {
        newStreak = streak.current_streak + 1;
      }
      // else newStreak stays 1 (reset)
    }
    newLongest = Math.max(streak.longest_streak, newStreak);
    await db.from("streak_snapshots").update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
      freeze_until: null, // Clear freeze after activity
    }).eq("id", streak.id);
  } else {
    await db.from("streak_snapshots").insert({
      member_id: memberId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_type: "daily",
    });
    newLongest = Math.max(newLongest, 1);
  }

  return { newStreak, newLongest };
}

async function checkLevelUp(db: ReturnType<typeof createClient>, totalXp: number, currentLevel: number) {
  const { data: levels } = await db
    .from("gamification_levels")
    .select("*")
    .eq("is_active", true)
    .order("level_number", { ascending: true });

  let newLevel = currentLevel;
  let leveledUp = false;
  if (levels) {
    for (const lvl of levels) {
      if (totalXp >= lvl.xp_required && lvl.level_number > newLevel) {
        newLevel = lvl.level_number;
        leveledUp = true;
      }
    }
  }
  return { newLevel, leveledUp };
}

async function processChallenges(
  db: ReturnType<typeof createClient>,
  memberId: string,
  eventType: string,
  xpDelta: number,
  newStreak: number,
  newTotalXp: number,
  newAvailablePoints: number,
) {
  const { data: activeChallenges } = await db
    .from("gamification_challenges")
    .select("*")
    .eq("status", "active")
    .lte("start_date", new Date().toISOString())
    .gte("end_date", new Date().toISOString());

  const results: Array<{ challenge_id: string; completed: boolean }> = [];
  if (!activeChallenges) return results;

  for (const challenge of activeChallenges) {
    const matchesGoal =
      (challenge.goal_type === "action_count" && challenge.goal_action_key === eventType) ||
      (challenge.goal_type === "xp_threshold") ||
      (challenge.goal_type === "class_count" && eventType === "class_attended") ||
      (challenge.goal_type === "streak" && eventType === "check_in");

    if (!matchesGoal) continue;

    let { data: progress } = await db
      .from("challenge_progress")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("member_id", memberId)
      .maybeSingle();

    if (!progress) {
      const { data: newProgress } = await db
        .from("challenge_progress")
        .insert({ challenge_id: challenge.id, member_id: memberId, current_value: 0, status: "in_progress" })
        .select()
        .single();
      progress = newProgress;
    }

    if (!progress || progress.status !== "in_progress") continue;

    let incrementValue = 1;
    if (challenge.goal_type === "xp_threshold") incrementValue = xpDelta;
    else if (challenge.goal_type === "streak") incrementValue = 0;

    const newValue = challenge.goal_type === "streak"
      ? newStreak
      : (progress.current_value || 0) + incrementValue;

    const completed = newValue >= challenge.goal_value;

    await db.from("challenge_progress").update({
      current_value: newValue,
      status: completed ? "completed" : "in_progress",
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", progress.id);

    if (completed) {
      const rewardXp = challenge.reward_xp || 0;
      const rewardPoints = challenge.reward_points || 0;
      const challengeIdemKey = `challenge_complete:${challenge.id}:${memberId}`;

      if (rewardXp > 0) {
        await db.from("xp_ledger").insert({
          member_id: memberId,
          event_type: "challenge_completed",
          delta: rewardXp,
          balance_after: newTotalXp + rewardXp,
          idempotency_key: `xp:${challengeIdemKey}`,
          metadata: { challenge_id: challenge.id },
        }).onConflict("idempotency_key").ignoreDuplicates();
      }

      if (rewardPoints > 0) {
        await db.from("points_ledger").insert({
          member_id: memberId,
          event_type: "challenge_completed",
          delta: rewardPoints,
          balance_after: newAvailablePoints + rewardPoints,
          idempotency_key: `pts:${challengeIdemKey}`,
          metadata: { challenge_id: challenge.id },
        }).onConflict("idempotency_key").ignoreDuplicates();
      }

      if (challenge.reward_badge_id) {
        await db.from("badge_earnings").insert({
          member_id: memberId,
          badge_id: challenge.reward_badge_id,
          event_ref: challengeIdemKey,
        }).onConflict("member_id,badge_id").ignoreDuplicates();
      }
    }

    results.push({ challenge_id: challenge.id, completed });
  }

  return results;
}

// ---------- Main Handler ----------

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    // Service client for writes
    const db = createClient(supabaseUrl, serviceKey);

    const body: GamificationEventRequest = await req.json();
    const { event_type, idempotency_key, metadata } = body;

    if (!event_type || !idempotency_key) {
      return new Response(JSON.stringify({ error: "Missing required fields: event_type, idempotency_key" }), { status: 400, headers: cors });
    }

    // Identity resolution — supports both direct member_id and cross-project experience_user_id
    const identity = await resolveMemberId(db, body);
    if (!identity) {
      return new Response(JSON.stringify({ error: "Could not resolve member identity. Provide member_id or a mapped experience_user_id." }), { status: 400, headers: cors });
    }

    const { member_id, location_id } = identity;

    // 1) IDEMPOTENCY CHECK
    const { data: existing } = await db.from("xp_ledger").select("id").eq("idempotency_key", idempotency_key).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ status: "already_processed", idempotency_key }), { status: 200, headers: cors });
    }

    // 2) FIND MATCHING ACTIVE RULE
    const rule = await findMatchingRule(db, event_type);
    if (!rule) {
      await db.from("gamification_audit_log").insert({
        member_id,
        event_type: "no_rule_match",
        action_key: event_type,
        xp_delta: 0,
        points_delta: 0,
        metadata: { idempotency_key, ...(metadata || {}) },
        flagged: false,
      });
      return new Response(JSON.stringify({ status: "no_matching_rule", event_type }), { status: 200, headers: cors });
    }

    // 3) ANTI-ABUSE: cooldown
    if (rule.cooldown_minutes && rule.cooldown_minutes > 0) {
      const blocked = await checkCooldown(db, member_id, event_type, rule.cooldown_minutes);
      if (blocked) {
        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "cooldown_blocked",
          action_key: event_type,
          xp_delta: 0,
          points_delta: 0,
          metadata: { idempotency_key, cooldown_minutes: rule.cooldown_minutes },
          flagged: true,
          flag_reason: `Cooldown: ${rule.cooldown_minutes}min not elapsed`,
        });
        return new Response(JSON.stringify({ status: "cooldown_active", retry_after_minutes: rule.cooldown_minutes }), { status: 200, headers: cors });
      }
    }

    // 4) ANTI-ABUSE: max_per_day
    if (rule.max_per_day && rule.max_per_day > 0) {
      const { exceeded, count } = await checkDailyLimit(db, member_id, event_type, rule.max_per_day);
      if (exceeded) {
        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "daily_limit_blocked",
          action_key: event_type,
          xp_delta: 0,
          points_delta: 0,
          metadata: { idempotency_key, max_per_day: rule.max_per_day, current_count: count },
          flagged: true,
          flag_reason: `Daily limit: ${rule.max_per_day} reached`,
        });
        return new Response(JSON.stringify({ status: "daily_limit_reached", max_per_day: rule.max_per_day }), { status: 200, headers: cors });
      }
    }

    // 5) GET OR CREATE MEMBER PROFILE
    const profile = await getOrCreateProfile(db, member_id);

    const xpDelta = rule.xp_value || 0;
    const pointsDelta = rule.points_value || 0;
    const newTotalXp = (profile.total_xp || 0) + xpDelta;
    const newTotalPoints = (profile.total_points || 0) + pointsDelta;
    const newAvailablePoints = (profile.available_points || 0) + pointsDelta;

    // 6) INSERT XP LEDGER (always insert for idempotency tracking)
    await db.from("xp_ledger").insert({
      member_id,
      event_type,
      delta: xpDelta,
      balance_after: newTotalXp,
      rule_id: rule.id,
      idempotency_key,
      location_id: location_id || null,
      metadata: metadata || {},
    });

    // 7) INSERT POINTS LEDGER
    if (pointsDelta !== 0) {
      await db.from("points_ledger").insert({
        member_id,
        event_type,
        delta: pointsDelta,
        balance_after: newAvailablePoints,
        rule_id: rule.id,
        idempotency_key: `pts:${idempotency_key}`,
        location_id: location_id || null,
        metadata: metadata || {},
      });
    }

    // 8) CHECK LEVEL UP
    const { newLevel, leveledUp } = await checkLevelUp(db, newTotalXp, profile.current_level || 1);

    // 9) UPDATE STREAK
    const { newStreak, newLongest } = await updateStreak(db, member_id, profile.longest_streak || 0);

    // 10) UPDATE PROFILE
    await db.from("member_gamification_profiles").update({
      total_xp: newTotalXp,
      total_points: newTotalPoints,
      available_points: newAvailablePoints,
      current_level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_at: new Date().toISOString(),
    }).eq("member_id", member_id);

    // 11) CHECK CHALLENGE PROGRESS
    const challengeResults = await processChallenges(
      db, member_id, event_type, xpDelta, newStreak, newTotalXp, newAvailablePoints
    );

    // 11.5) REFERRAL REWARD — on first check_in, complete referral if exists
    let referralCompleted = false;
    if (event_type === "check_in") {
      const { data: pendingReferral } = await db
        .from("member_referrals")
        .select("id, referrer_member_id, referrer_reward_points, referred_reward_points")
        .eq("referred_member_id", member_id)
        .eq("status", "signed_up")
        .eq("reward_granted", false)
        .maybeSingle();

      if (pendingReferral) {
        const referrerPoints = pendingReferral.referrer_reward_points ?? 200;
        const referredPoints = pendingReferral.referred_reward_points ?? 200;
        const refIdemKey = `referral_reward:${pendingReferral.id}`;

        // Grant points to referrer
        const referrerProfile = await getOrCreateProfile(db, pendingReferral.referrer_member_id);
        const referrerNewAvail = (referrerProfile.available_points || 0) + referrerPoints;
        const referrerNewTotal = (referrerProfile.total_points || 0) + referrerPoints;

        await db.from("points_ledger").insert({
          member_id: pendingReferral.referrer_member_id,
          event_type: "referral_reward",
          delta: referrerPoints,
          balance_after: referrerNewAvail,
          idempotency_key: `pts:${refIdemKey}:referrer`,
          metadata: { referral_id: pendingReferral.id, role: "referrer" },
        }).onConflict("idempotency_key").ignoreDuplicates();

        await db.from("member_gamification_profiles").update({
          total_points: referrerNewTotal,
          available_points: referrerNewAvail,
        }).eq("member_id", pendingReferral.referrer_member_id);

        // Grant points to referred (current member)
        const referredNewAvail = newAvailablePoints + referredPoints;
        const referredNewTotal = newTotalPoints + referredPoints;

        await db.from("points_ledger").insert({
          member_id,
          event_type: "referral_reward",
          delta: referredPoints,
          balance_after: referredNewAvail,
          idempotency_key: `pts:${refIdemKey}:referred`,
          metadata: { referral_id: pendingReferral.id, role: "referred" },
        }).onConflict("idempotency_key").ignoreDuplicates();

        await db.from("member_gamification_profiles").update({
          total_points: referredNewTotal,
          available_points: referredNewAvail,
        }).eq("member_id", member_id);

        // Mark referral as completed
        await db.from("member_referrals").update({
          status: "completed",
          reward_granted: true,
          completed_at: new Date().toISOString(),
        }).eq("id", pendingReferral.id);

        referralCompleted = true;

        // Audit log for referral
        await db.from("gamification_audit_log").insert({
          member_id,
          event_type: "referral_completed",
          action_key: "referral_reward",
          xp_delta: 0,
          points_delta: referredPoints,
          metadata: {
            referral_id: pendingReferral.id,
            referrer_member_id: pendingReferral.referrer_member_id,
            referrer_points: referrerPoints,
            referred_points: referredPoints,
          },
          flagged: false,
        });

        // Send notification to referrer
        const { data: referredMember } = await db
          .from("members")
          .select("first_name")
          .eq("id", member_id)
          .maybeSingle();

        const referrerUserId = await (async () => {
          const { data: im } = await db
            .from("identity_map")
            .select("experience_user_id")
            .eq("admin_entity_id", pendingReferral.referrer_member_id)
            .eq("entity_type", "member")
            .eq("is_verified", true)
            .maybeSingle();
          return im?.experience_user_id ?? null;
        })();

        if (referrerUserId) {
          await db.from("notifications").insert({
            user_id: referrerUserId,
            title: `🎉 Your friend ${referredMember?.first_name ?? "someone"} just checked in!`,
            message: `You both earned ${referrerPoints} Reward Points. Keep inviting friends!`,
            type: "referral_completed",
            is_read: false,
          });
        }
      }
    }

    // 12) AUDIT LOG
    await db.from("gamification_audit_log").insert({
      member_id,
      event_type,
      action_key: rule.action_key,
      xp_delta: xpDelta,
      points_delta: pointsDelta,
      metadata: {
        idempotency_key,
        rule_id: rule.id,
        level_before: profile.current_level,
        level_after: newLevel,
        leveled_up: leveledUp,
        streak: newStreak,
        challenges: challengeResults,
        source: body.experience_user_id ? "experience_app" : "admin_app",
        ...(metadata || {}),
      },
      flagged: false,
    });

    // 13) NOTIFICATION on level-up
    if (leveledUp) {
      await db.from("event_outbox").insert({
        event_type: "gamification.level_up",
        payload: {
          member_id,
          old_level: profile.current_level,
          new_level: newLevel,
          total_xp: newTotalXp,
        },
      });
    }

    // 14) Fetch badges earned (for cross-project response)
    const { data: recentBadges } = await db
      .from("badge_earnings")
      .select("badge_id, gamification_badges(id, name_en, icon_url)")
      .eq("member_id", member_id)
      .order("earned_at", { ascending: false })
      .limit(5);

    const badgesEarned = (recentBadges || [])
      .filter((b: any) => b.gamification_badges)
      .map((b: any) => ({
        id: b.gamification_badges.id,
        name: b.gamification_badges.name_en,
        icon_url: b.gamification_badges.icon_url,
      }));

    return new Response(JSON.stringify({
      status: "processed",
      // Standard response
      xp_granted: xpDelta,
      points_granted: pointsDelta,
      total_xp: newTotalXp,
      available_points: newAvailablePoints,
      level: newLevel,
      leveled_up: leveledUp,
      streak: newStreak,
      challenges: challengeResults,
      referral_completed: referralCompleted,
      // Cross-project response fields
      new_total_xp: newTotalXp,
      new_level: newLevel,
      badges_earned: badgesEarned,
      challenge_updates: challengeResults.map((c) => ({
        id: c.challenge_id,
        completed: c.completed,
      })),
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-process-event error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
