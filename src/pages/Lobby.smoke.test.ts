import { describe, it, expect } from 'vitest';
import enLocale from '@/i18n/locales/en';
import thLocale from '@/i18n/locales/th';

/**
 * Lobby contract smoke test.
 *
 * Locks in the i18n keys, help text, and structural contract that the
 * Lobby surface depends on. Catches the most common AI regressions:
 *  - a key gets renamed/removed in one locale but not the other
 *  - help tooltip text disappears when refactoring
 *  - the lobby namespace loses a sub-namespace (details / help)
 */

const en = enLocale as any;
const th = thLocale as any;

describe('Lobby i18n contract', () => {
  const requiredTopKeys = [
    'title', 'checkIn', 'qrCode', 'searchPlaceholder',
    'time', 'name', 'packageUsed', 'usage', 'location', 'checkinMethod',
    'manual', 'noCheckins', 'liveBadge',
    'kpiTotal', 'kpiCurrentlyIn', 'kpiPackage', 'kpiWalkIn',
    'filters', 'filterLocation', 'filterMethod', 'filterPackage',
    'filterAll', 'filterWithPackage', 'filterWalkIn', 'clearFilters',
    'newCheckinHighlight',
  ];

  it.each(requiredTopKeys)('lobby.%s exists in EN and TH', (key) => {
    expect(en.lobby?.[key], `EN lobby.${key}`).toBeTruthy();
    expect(th.lobby?.[key], `TH lobby.${key}`).toBeTruthy();
  });

  it('lobby.details has full sub-namespace in EN and TH', () => {
    for (const k of ['title', 'member', 'package', 'checkin', 'openMember', 'noPackage']) {
      expect(en.lobby.details?.[k], `EN lobby.details.${k}`).toBeTruthy();
      expect(th.lobby.details?.[k], `TH lobby.details.${k}`).toBeTruthy();
    }
  });

  it('lobby.help tooltips exist in EN and TH', () => {
    for (const k of ['filters', 'checkInButton', 'qrButton']) {
      expect(en.lobby.help?.[k], `EN lobby.help.${k}`).toBeTruthy();
      expect(th.lobby.help?.[k], `TH lobby.help.${k}`).toBeTruthy();
    }
  });
});
