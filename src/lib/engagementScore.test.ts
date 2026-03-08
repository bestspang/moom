import { describe, it, expect } from 'vitest';
import { calculateEngagementScore } from './engagementScore';

describe('calculateEngagementScore', () => {
  it('returns 0 score for never-visited member', () => {
    const result = calculateEngagementScore({
      totalVisits: 0,
      daysSinceLastVisit: null,
      sessionsUsed: 0,
      totalSessions: 10,
      daysSinceJoin: 30,
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
  });

  it('returns high score for very active member', () => {
    const result = calculateEngagementScore({
      totalVisits: 20,
      daysSinceLastVisit: 0,
      sessionsUsed: 8,
      totalSessions: 10,
      daysSinceJoin: 30,
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toBe('high');
  });

  it('handles unlimited package (totalSessions=null)', () => {
    const result = calculateEngagementScore({
      totalVisits: 12,
      daysSinceLastVisit: 2,
      sessionsUsed: 0,
      totalSessions: null,
      daysSinceJoin: 30,
    });
    // usage defaults to 50 for unlimited
    expect(result.score).toBeGreaterThan(0);
  });

  it('returns medium for moderate activity', () => {
    const result = calculateEngagementScore({
      totalVisits: 4,
      daysSinceLastVisit: 15,
      sessionsUsed: 3,
      totalSessions: 10,
      daysSinceJoin: 30,
    });
    expect(result.level).toBe('medium');
  });

  it('clamps score to 0-100 range', () => {
    const result = calculateEngagementScore({
      totalVisits: 1000,
      daysSinceLastVisit: 0,
      sessionsUsed: 100,
      totalSessions: 10,
      daysSinceJoin: 1,
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('returns low for stale member (30+ days)', () => {
    const result = calculateEngagementScore({
      totalVisits: 1,
      daysSinceLastVisit: 45,
      sessionsUsed: 1,
      totalSessions: 20,
      daysSinceJoin: 90,
    });
    expect(result.level).toBe('low');
  });
});
