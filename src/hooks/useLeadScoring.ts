
/**
 * useLeadScoring — compute 0-100 lead scores client-side from existing lead fields.
 * Scoring factors:
 *   - Recency of last contact (max 25)
 *   - Times contacted (max 15)
 *   - Has package interest (15)
 *   - Source quality (10)
 *   - Status progression (20)
 *   - Last attended (15)
 */

interface LeadRow {
  id: string;
  status?: string | null;
  times_contacted?: number | null;
  last_contacted?: string | null;
  last_attended?: string | null;
  package_interest_id?: string | null;
  source?: string | null;
  temperature?: string | null;
}

export interface LeadScore {
  score: number;
  level: 'high' | 'medium' | 'low';
}

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function computeLeadScore(lead: LeadRow): LeadScore {
  let score = 0;

  // 1. Recency of last contact (max 25)
  const contactDays = daysSince(lead.last_contacted);
  if (contactDays !== null) {
    if (contactDays <= 3) score += 25;
    else if (contactDays <= 7) score += 20;
    else if (contactDays <= 14) score += 12;
    else if (contactDays <= 30) score += 5;
  }

  // 2. Times contacted (max 15)
  const tc = lead.times_contacted || 0;
  if (tc >= 3) score += 15;
  else if (tc >= 2) score += 10;
  else if (tc >= 1) score += 5;

  // 3. Package interest (15)
  if (lead.package_interest_id) score += 15;

  // 4. Source quality (10)
  const goodSources = ['referral', 'walk_in'];
  if (lead.source && goodSources.includes(lead.source)) score += 10;
  else if (lead.source === 'social_media' || lead.source === 'website') score += 5;

  // 5. Status progression (20)
  switch (lead.status) {
    case 'interested': score += 20; break;
    case 'contacted': score += 10; break;
    case 'new': score += 5; break;
    case 'converted': score += 20; break;
    default: break;
  }

  // 6. Last attended (15)
  const attendDays = daysSince(lead.last_attended);
  if (attendDays !== null) {
    if (attendDays <= 7) score += 15;
    else if (attendDays <= 14) score += 10;
    else if (attendDays <= 30) score += 5;
  }

  // 7. Temperature boost
  if (lead.temperature === 'hot') score += 5;

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  const level: LeadScore['level'] =
    score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, level };
}
