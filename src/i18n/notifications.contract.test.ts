import { describe, it, expect } from 'vitest';
import enLocale from '@/i18n/locales/en';
import thLocale from '@/i18n/locales/th';

const en = enLocale as any;
const th = thLocale as any;

/**
 * Notifications i18n contract.
 *
 * Catches the most common regressions:
 *  - a type label gets removed from one locale during a refactor
 *  - a top-level label used by the hook (e.g. notifications.allMarkedRead)
 *    silently disappears, breaking toast text
 */
describe('Notifications i18n contract', () => {
  const requiredTopKeys = [
    'title',
    'unread',
    'read',
    'new',
    'markAllRead',
    'allMarkedRead', // referenced by useMarkAllAsRead toast
    'noUnread',
  ];

  it.each(requiredTopKeys)('notifications.%s exists in EN and TH', (k) => {
    expect(en.notifications?.[k], `EN notifications.${k}`).toBeTruthy();
    expect(th.notifications?.[k], `TH notifications.${k}`).toBeTruthy();
  });

  const requiredTypeKeys = [
    'booking',
    'cancellation',
    'payment',
    'registration',
    'expiring',
    'tierChange',
    'badgeEarned',
    'levelUp',
    'challengeCompleted',
    'rewardFulfilled',
    'streakMilestone',
    'xpEarned',
    'referralCompleted',
  ];

  it.each(requiredTypeKeys)('notifications.types.%s exists in EN and TH', (k) => {
    expect(en.notifications?.types?.[k], `EN notifications.types.${k}`).toBeTruthy();
    expect(th.notifications?.types?.[k], `TH notifications.types.${k}`).toBeTruthy();
  });
});
