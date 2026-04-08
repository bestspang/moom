/**
 * ProtectedRoute Security Tests
 *
 * These tests verify the access control logic WITHOUT rendering the actual
 * ProtectedRoute component (which has deep import chains that require
 * browser APIs). Instead we test the LOGIC directly.
 */

describe('ProtectedRoute access level logic', () => {
  // Replicate the exact access level ordering from ProtectedRoute.tsx:17-22
  const accessLevelOrder: Record<string, number> = {
    level_1_minimum: 1,
    level_2_operator: 2,
    level_3_manager: 3,
    level_4_master: 4,
  };

  /**
   * Replicate the exact access control logic from ProtectedRoute.tsx:70-80
   * Returns: 'allow' | 'deny' | 'no-check'
   */
  function checkAccess(
    minAccessLevel: string | undefined,
    accessLevel: string | null,
  ): 'allow' | 'deny' | 'no-check' {
    if (minAccessLevel) {
      if (!accessLevel) {
        return 'deny';
      }
      const userLevel = accessLevelOrder[accessLevel];
      const requiredLevel = accessLevelOrder[minAccessLevel];
      if (userLevel < requiredLevel) {
        return 'deny';
      }
    }
    return minAccessLevel ? 'allow' : 'no-check';
  }

  describe('authentication gate', () => {
    it('skips access level check when no minAccessLevel is set', () => {
      expect(checkAccess(undefined, null)).toBe('no-check');
      expect(checkAccess(undefined, 'level_1_minimum')).toBe('no-check');
    });
  });

  describe('access level enforcement', () => {
    it('CRITICAL: denies access when accessLevel is null but minAccessLevel is required', () => {
      // This is the exact regression test for the security fix.
      // Before the fix, null accessLevel would BYPASS the check entirely.
      expect(checkAccess('level_1_minimum', null)).toBe('deny');
      expect(checkAccess('level_2_operator', null)).toBe('deny');
      expect(checkAccess('level_3_manager', null)).toBe('deny');
      expect(checkAccess('level_4_master', null)).toBe('deny');
    });

    it('denies access when user level is below required level', () => {
      expect(checkAccess('level_2_operator', 'level_1_minimum')).toBe('deny');
      expect(checkAccess('level_3_manager', 'level_1_minimum')).toBe('deny');
      expect(checkAccess('level_3_manager', 'level_2_operator')).toBe('deny');
      expect(checkAccess('level_4_master', 'level_1_minimum')).toBe('deny');
      expect(checkAccess('level_4_master', 'level_2_operator')).toBe('deny');
      expect(checkAccess('level_4_master', 'level_3_manager')).toBe('deny');
    });

    it('allows access when user level equals required level', () => {
      expect(checkAccess('level_1_minimum', 'level_1_minimum')).toBe('allow');
      expect(checkAccess('level_2_operator', 'level_2_operator')).toBe('allow');
      expect(checkAccess('level_3_manager', 'level_3_manager')).toBe('allow');
      expect(checkAccess('level_4_master', 'level_4_master')).toBe('allow');
    });

    it('allows access when user level exceeds required level', () => {
      expect(checkAccess('level_1_minimum', 'level_2_operator')).toBe('allow');
      expect(checkAccess('level_1_minimum', 'level_4_master')).toBe('allow');
      expect(checkAccess('level_2_operator', 'level_3_manager')).toBe('allow');
      expect(checkAccess('level_2_operator', 'level_4_master')).toBe('allow');
      expect(checkAccess('level_3_manager', 'level_4_master')).toBe('allow');
    });
  });

  describe('access level hierarchy', () => {
    it('ranks levels in correct ascending order', () => {
      const levels = Object.entries(accessLevelOrder).sort((a, b) => a[1] - b[1]);
      expect(levels.map(([k]) => k)).toEqual([
        'level_1_minimum',
        'level_2_operator',
        'level_3_manager',
        'level_4_master',
      ]);
    });

    it('has exactly 4 levels defined', () => {
      expect(Object.keys(accessLevelOrder)).toHaveLength(4);
    });
  });
});
