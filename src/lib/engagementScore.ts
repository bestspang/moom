export interface EngagementInput {
  totalVisits: number;
  daysSinceLastVisit: number | null; // null = never visited
  sessionsUsed: number;
  totalSessions: number | null; // null = unlimited
  daysSinceJoin: number;
}

export type EngagementLevel = 'high' | 'medium' | 'low';

export interface EngagementResult {
  score: number;
  level: EngagementLevel;
}

/**
 * Calculate member engagement score (0-100).
 * Formula: recency (40%) + frequency (30%) + usage (30%)
 */
export function calculateEngagementScore(input: EngagementInput): EngagementResult {
  // Recency: 100 if visited today, linear decay to 0 at 30+ days
  let recency = 0;
  if (input.daysSinceLastVisit === null) {
    recency = 0; // never visited
  } else {
    recency = Math.max(0, 100 - (input.daysSinceLastVisit / 30) * 100);
  }

  // Frequency: visits per week, normalized (4+ visits/week = 100)
  const weeks = Math.max(1, input.daysSinceJoin / 7);
  const visitsPerWeek = input.totalVisits / weeks;
  const frequency = Math.min(100, (visitsPerWeek / 4) * 100);

  // Usage: sessions used / total sessions (if applicable)
  let usage = 50; // default for unlimited packages
  if (input.totalSessions !== null && input.totalSessions > 0) {
    usage = Math.min(100, (input.sessionsUsed / input.totalSessions) * 100);
  }

  const score = Math.round(recency * 0.4 + frequency * 0.3 + usage * 0.3);
  const clampedScore = Math.max(0, Math.min(100, score));

  let level: EngagementLevel;
  if (clampedScore >= 60) level = 'high';
  else if (clampedScore >= 30) level = 'medium';
  else level = 'low';

  return { score: clampedScore, level };
}
