/**
 * Gamification Pages i18n Smoke Tests
 *
 * Verifies that all i18n keys used in the 6 modified gamification pages
 * exist in both en.ts and th.ts. This catches the common AI regression
 * of adding t('key') calls without adding the key to locale files.
 */
import en from '@/i18n/locales/en';
import th from '@/i18n/locales/th';

// Helper to get a nested value by dot-notation key
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function assertKeysExist(keys: string[], localeName: string, locale: any) {
  const missing: string[] = [];
  for (const key of keys) {
    if (getNestedValue(locale, key) === undefined) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing ${localeName} keys:\n  ${missing.join('\n  ')}`);
  }
}

describe('GamificationQuests i18n keys', () => {
  const keys = [
    'gamification.quests.description', 'gamification.quests.addQuest',
    'gamification.quests.noQuests', 'gamification.quests.noQuestsDesc',
    'gamification.quests.editQuest', 'gamification.quests.createQuest',
    'gamification.quests.daily', 'gamification.quests.weekly',
    'gamification.quests.monthly', 'gamification.quests.seasonal',
    'gamification.quests.period', 'gamification.quests.audience',
    'gamification.quests.audienceMember', 'gamification.quests.audienceTrainerInhouse',
    'gamification.quests.goalType', 'gamification.quests.goalActionCount',
    'gamification.quests.xpReward', 'gamification.quests.coinReward',
    'gamification.quests.sortOrder',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationShopRules i18n keys', () => {
  const keys = [
    'gamification.shopRules.description', 'gamification.shopRules.addRule',
    'gamification.shopRules.noRules', 'gamification.shopRules.noRulesDesc',
    'gamification.shopRules.editRule', 'gamification.shopRules.createRule',
    'gamification.shopRules.orderType', 'gamification.shopRules.typeMerch',
    'gamification.shopRules.typePackage', 'gamification.shopRules.typeEvent',
    'gamification.shopRules.minSpend', 'gamification.shopRules.xpRules',
    'gamification.shopRules.xpPerOrder', 'gamification.shopRules.xpCap',
    'gamification.shopRules.coinRules', 'gamification.shopRules.coinPerUnit',
    'gamification.shopRules.coinCap', 'gamification.shopRules.requiredLevel',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationOperations i18n keys', () => {
  const keys = [
    'gamification.operations.title', 'gamification.operations.description',
    'gamification.operations.operationLabel', 'gamification.operations.operationHint',
    'gamification.operations.adjustXp', 'gamification.operations.adjustXpDesc',
    'gamification.operations.adjustCoin', 'gamification.operations.adjustCoinDesc',
    'gamification.operations.grantBadge', 'gamification.operations.grantBadgeDesc',
    'gamification.operations.revokeBadge', 'gamification.operations.issueCoupon',
    'gamification.operations.memberIdRequired', 'gamification.operations.reasonRequired',
    'gamification.operations.success', 'gamification.operations.error',
    'gamification.operations.memberId', 'gamification.operations.amountLabel',
    'gamification.operations.execute',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationOverview i18n keys', () => {
  const keys = [
    'gamification.overview.economyHealth', 'gamification.overview.activeProfiles',
    'gamification.overview.coinInCirculation', 'gamification.overview.totalRedemptions',
    'gamification.overview.questCompletion', 'gamification.overview.systemConfig',
    'gamification.overview.levels', 'gamification.overview.questTemplates',
    'gamification.overview.economySummary', 'gamification.overview.totalXpDistributed',
    'gamification.overview.totalCoinEarned', 'gamification.overview.totalCoinSpent',
    'gamification.overview.avgMemberLevel', 'gamification.overview.questsAssigned',
    'gamification.overview.badgesEarned',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationGuardrails i18n keys', () => {
  const keys = [
    'gamification.guardrails.title', 'gamification.guardrails.description',
    'gamification.guardrails.ruleCode', 'gamification.guardrails.value',
    'gamification.guardrails.descriptionCol',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationPrestige i18n keys', () => {
  const keys = [
    'gamification.prestige.title', 'gamification.prestige.description',
    'gamification.prestige.updateSuccess', 'gamification.prestige.criterion',
    'gamification.prestige.target', 'gamification.prestige.descriptionCol',
    'gamification.prestige.noCriteria',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});

describe('GamificationStatusTiers i18n keys', () => {
  const keys = [
    'gamification.statusTiers.totalTiers', 'gamification.statusTiers.spRules',
    'gamification.statusTiers.benefits', 'gamification.statusTiers.evaluatedMembers',
    'gamification.statusTiers.qualificationRules', 'gamification.statusTiers.tier',
    'gamification.statusTiers.minLevel', 'gamification.statusTiers.minSp90d',
    'gamification.statusTiers.activeDays', 'gamification.statusTiers.reqPackage',
    'gamification.statusTiers.members', 'gamification.statusTiers.spEarningRules',
    'gamification.statusTiers.actionKey', 'gamification.statusTiers.spValue',
    'gamification.statusTiers.dailyCap', 'gamification.statusTiers.tierBenefits',
    'gamification.statusTiers.benefit', 'gamification.statusTiers.frequency',
    'gamification.statusTiers.maxPerMonth',
  ];

  it('all keys exist in en.ts', () => assertKeysExist(keys, 'EN', en));
  it('all keys exist in th.ts', () => assertKeysExist(keys, 'TH', th));
});
