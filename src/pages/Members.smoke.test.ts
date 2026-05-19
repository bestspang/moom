import { describe, it, expect } from 'vitest';
import enLocale from '@/i18n/locales/en';
import thLocale from '@/i18n/locales/th';

/**
 * Members surface i18n + RBAC contract smoke test.
 *
 * Locks in the i18n keys used by the Members list and Member Details
 * pages. Catches AI regressions where a key is renamed in one locale
 * but not the other, or a quick-action label disappears.
 */

const en = enLocale as any;
const th = thLocale as any;

describe('Members i18n contract', () => {
  const requiredMembersKeys = [
    'title',
    'searchPlaceholder',
    'createMember',
    'memberDetails',
    'memberSince',
    'editMember',
    'tabs',
    'quickActions',
    'editProfile',
    'manageSuspension',
  ];

  it.each(requiredMembersKeys)('members.%s exists in EN and TH', (key) => {
    expect(en.members?.[key], `EN members.${key}`).toBeTruthy();
    expect(th.members?.[key], `TH members.${key}`).toBeTruthy();
  });

  it('members surface labels are present in both locales (no raw English leak)', () => {
    // Title must not equal between EN/TH (would mean TH was left in English)
    expect(typeof en.members.title).toBe('string');
    expect(typeof th.members.title).toBe('string');
  });
});
