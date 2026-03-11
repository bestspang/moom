/**
 * Emoji fallback for badges when icon_url is missing or broken.
 * Keyed by unlock_condition.type or badge name pattern.
 */

const CONDITION_EMOJI: Record<string, string> = {
  checkin_count: '🏃',
  class_attend_count: '🎯',
  open_gym_count: '💪',
  distinct_class_types: '🧭',
  consecutive_weeks: '🔥',
  streak: '🔥',
  squad_join: '🤝',
  successful_referral: '⭐',
  shop_order_count: '🛍️',
  comeback_visits: '💫',
  xp_total: '✨',
  level: '🏆',
};

/**
 * Return an emoji for a badge based on its unlock condition type or name.
 */
export function getBadgeEmoji(
  unlockCondition?: Record<string, unknown> | null,
  badgeName?: string | null,
): string {
  // Try unlock_condition.type first
  const condType = (unlockCondition as Record<string, string> | undefined)?.type;
  if (condType && CONDITION_EMOJI[condType]) return CONDITION_EMOJI[condType];

  // Fallback: match badge name keywords
  const name = (badgeName ?? '').toLowerCase();
  if (name.includes('streak') || name.includes('fire')) return '🔥';
  if (name.includes('check') || name.includes('step')) return '🏃';
  if (name.includes('class') || name.includes('attend')) return '🎯';
  if (name.includes('gym') || name.includes('muscle')) return '💪';
  if (name.includes('squad') || name.includes('team')) return '🤝';
  if (name.includes('refer')) return '⭐';
  if (name.includes('shop') || name.includes('buy')) return '🛍️';
  if (name.includes('explorer') || name.includes('variety')) return '🧭';
  if (name.includes('comeback') || name.includes('return')) return '💫';

  return '🏅';
}
