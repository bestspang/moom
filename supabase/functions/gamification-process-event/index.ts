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
  member_id: string;
  idempotency_key: string;
  location_id?: string;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

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
    const { event_type, member_id, idempotency_key, location_id, metadata } = body;

    if (!event_type || !member_id || !idempotency_key) {
      return new Response(JSON.stringify({ error: "Missing required fields: event_type, member_id, idempotency_key" }), { status: 400, headers: cors });
    }

    // 1) IDEMPOTENCY CHECK — if xp_ledger already has this key, skip
    const { data: existing } = await db.from("xp_ledger").select("id").eq("idempotency_key", idempotency_key).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ status: "already_processed", idempotency_key }), { status: 200, headers: cors });
    }

    // 2) FIND MATCHING ACTIVE RULE
    const { data: rules } = await db
      .from("gamification_rules")
      .select("*")
      .eq("action_key", event_type)
      .eq("is_active", true)
      .limit(1);

    const rule = rules?.[0];
    if (!rule) {
      // No rule configured for this event — log audit and skip
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

    // 3) ANTI-ABUSE: cooldown check
    if (rule.cooldown_minutes && rule.cooldown_minutes > 0) {
      const cooldownThreshold = new Date(Date.now() - rule.cooldown_minutes * 60 * 1000).toISOString();
      const { data: recentEntries } = await db
        .from("xp_ledger")
        .select("id")
        .eq("member_id", member_id)
        .eq("event_type", event_type)
        .gte("created_at", cooldownThreshold)
        .limit(1);

      if (recentEntries && recentEntries.length > 0) {
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

    // 4) ANTI-ABUSE: max_per_day check
    if (rule.max_per_day && rule.max_per_day > 0) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const { count } = await db
        .from("xp_ledger")
        .select("id", { count: "exact", head: true })
        .eq("member_id", member_id)
        .eq("event_type", event_type)
        .gte("created_at", todayStart.toISOString());

      if ((count ?? 0) >= rule.max_per_day) {
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
    let { data: profile } = await db
      .from("member_gamification_profiles")
      .select("*")
      .eq("member_id", member_id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: createErr } = await db
        .from("member_gamification_profiles")
        .insert({ member_id, total_xp: 0, total_points: 0, available_points: 0, current_level: 1 })
        .select()
        .single();
      if (createErr) throw createErr;
      profile = newProfile;
    }

    const xpDelta = rule.xp_value || 0;
    const pointsDelta = rule.points_value || 0;
    const newTotalXp = (profile.total_xp || 0) + xpDelta;
    const newTotalPoints = (profile.total_points || 0) + pointsDelta;
    const newAvailablePoints = (profile.available_points || 0) + pointsDelta;

    // 6) INSERT XP LEDGER
    if (xpDelta !== 0) {
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
    } else {
      // Still insert for idempotency tracking even with 0 XP
      await db.from("xp_ledger").insert({
        member_id,
        event_type,
        delta: 0,
        balance_after: newTotalXp,
        rule_id: rule.id,
        idempotency_key,
        location_id: location_id || null,
        metadata: metadata || {},
      });
    }

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
    const { data: levels } = await db
      .from("gamification_levels")
      .select("*")
      .eq("is_active", true)
      .order("level_number", { ascending: true });

    let newLevel = profile.current_level || 1;
    let leveledUp = false;
    if (levels) {
      for (const lvl of levels) {
        if (newTotalXp >= lvl.xp_required && lvl.level_number > newLevel) {
          newLevel = lvl.level_number;
          leveledUp = true;
        }
      }
    }

    // 9) UPDATE STREAK
    const today = new Date().toISOString().split("T")[0];
    const { data: streak } = await db
      .from("streak_snapshots")
      .select("*")
      .eq("member_id", member_id)
      .eq("streak_type", "daily")
      .maybeSingle();

    let newStreak = 1;
    let newLongest = profile.longest_streak || 0;

    if (streak) {
      const lastDate = streak.last_activity_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (lastDate === today) {
        // Same day — no streak change
        newStreak = streak.current_streak;
      } else if (lastDate === yesterday) {
        // Consecutive day
        newStreak = streak.current_streak + 1;
      }
      // else: streak resets to 1

      newLongest = Math.max(streak.longest_streak, newStreak);

      await db.from("streak_snapshots").update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
      }).eq("id", streak.id);
    } else {
      await db.from("streak_snapshots").insert({
        member_id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        streak_type: "daily",
      });
      newLongest = Math.max(newLongest, 1);
    }

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
    const { data: activeChallenges } = await db
      .from("gamification_challenges")
      .select("*")
      .eq("status", "active")
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString());

    const challengeResults: Array<{ challenge_id: string; completed: boolean }> = [];

    if (activeChallenges) {
      for (const challenge of activeChallenges) {
        // Check if this event matches the challenge goal
        const matchesGoal =
          (challenge.goal_type === "action_count" && challenge.goal_action_key === event_type) ||
          (challenge.goal_type === "xp_threshold") ||
          (challenge.goal_type === "class_count" && event_type === "class_attended") ||
          (challenge.goal_type === "streak" && event_type === "check_in");

        if (!matchesGoal) continue;

        // Get or create progress
        let { data: progress } = await db
          .from("challenge_progress")
          .select("*")
          .eq("challenge_id", challenge.id)
          .eq("member_id", member_id)
          .maybeSingle();

        if (!progress) {
          const { data: newProgress } = await db
            .from("challenge_progress")
            .insert({ challenge_id: challenge.id, member_id, current_value: 0, status: "in_progress" })
            .select()
            .single();
          progress = newProgress;
        }

        if (!progress || progress.status !== "in_progress") continue;

        let incrementValue = 1;
        if (challenge.goal_type === "xp_threshold") {
          incrementValue = xpDelta;
        } else if (challenge.goal_type === "streak") {
          incrementValue = 0; // Streak challenges check streak value directly
        }

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
          // Grant challenge rewards
          const rewardXp = challenge.reward_xp || 0;
          const rewardPoints = challenge.reward_points || 0;
          const challengeIdemKey = `challenge_complete:${challenge.id}:${member_id}`;

          if (rewardXp > 0) {
            const xpAfter = newTotalXp + rewardXp;
            await db.from("xp_ledger").insert({
              member_id,
              event_type: "challenge_completed",
              delta: rewardXp,
              balance_after: xpAfter,
              idempotency_key: `xp:${challengeIdemKey}`,
              metadata: { challenge_id: challenge.id },
            }).onConflict("idempotency_key").ignoreDuplicates();
          }

          if (rewardPoints > 0) {
            const ptsAfter = newAvailablePoints + rewardPoints;
            await db.from("points_ledger").insert({
              member_id,
              event_type: "challenge_completed",
              delta: rewardPoints,
              balance_after: ptsAfter,
              idempotency_key: `pts:${challengeIdemKey}`,
              metadata: { challenge_id: challenge.id },
            }).onConflict("idempotency_key").ignoreDuplicates();
          }

          // Award badge if configured
          if (challenge.reward_badge_id) {
            await db.from("badge_earnings").insert({
              member_id,
              badge_id: challenge.reward_badge_id,
              event_ref: challengeIdemKey,
            }).onConflict("member_id,badge_id").ignoreDuplicates();
          }
        }

        challengeResults.push({ challenge_id: challenge.id, completed });
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

    return new Response(JSON.stringify({
      status: "processed",
      xp_granted: xpDelta,
      points_granted: pointsDelta,
      total_xp: newTotalXp,
      available_points: newAvailablePoints,
      level: newLevel,
      leveled_up: leveledUp,
      streak: newStreak,
      challenges: challengeResults,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("gamification-process-event error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
});
