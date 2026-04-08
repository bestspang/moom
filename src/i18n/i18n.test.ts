import en from './locales/en';
import th from './locales/th';

// Helper to flatten nested objects into dot-notation keys
function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n locale files', () => {
  const enKeys = flattenKeys(en);
  const thKeys = flattenKeys(th);
  const enSet = new Set(enKeys);
  const thSet = new Set(thKeys);

  it('en.ts has all expected top-level sections', () => {
    const required = ['common', 'nav', 'gamification', 'auth', 'finance', 'staff', 'roadmap', 'member', 'form'];
    for (const section of required) {
      expect(en).toHaveProperty(section);
    }
  });

  it('th.ts has all expected top-level sections', () => {
    const required = ['common', 'nav', 'gamification', 'auth', 'finance', 'staff', 'roadmap', 'member', 'form'];
    for (const section of required) {
      expect(th).toHaveProperty(section);
    }
  });

  it('critical gamification keys exist in en.ts', () => {
    const criticalKeys = [
      'gamification.overview.economyHealth',
      'gamification.overview.activeProfiles',
      'gamification.overview.economySummary',
      'gamification.quests.addQuest',
      'gamification.quests.noQuests',
      'gamification.quests.daily',
      'gamification.shopRules.description',
      'gamification.shopRules.addRule',
      'gamification.shopRules.orderType',
      'gamification.operations.title',
      'gamification.operations.execute',
      'gamification.operations.adjustXp',
      'gamification.guardrails.title',
      'gamification.guardrails.ruleCode',
      'gamification.prestige.title',
      'gamification.prestige.criterion',
      'gamification.statusTiers.totalTiers',
      'gamification.statusTiers.tier',
      'gamification.coupons.addCoupon',
      'gamification.coupons.noCoupons',
    ];

    for (const key of criticalKeys) {
      expect(enSet.has(key)).toBe(true);
    }
  });

  it('critical auth keys exist in en.ts', () => {
    const authKeys = [
      'auth.accessDenied',
      'auth.accessDeniedDescription',
      'auth.backTo',
      'auth.home',
      'auth.dashboard',
    ];

    for (const key of authKeys) {
      expect(enSet.has(key)).toBe(true);
    }
  });

  it('gamification.overview keys have matching th.ts entries', () => {
    const enOverviewKeys = enKeys.filter(k => k.startsWith('gamification.overview.'));
    expect(enOverviewKeys.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const key of enOverviewKeys) {
      if (!thSet.has(key)) {
        missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });
});
