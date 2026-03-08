import { describe, it, expect } from 'vitest';
import { computeLeadScore } from './useLeadScoring';

describe('computeLeadScore', () => {
  it('returns low for empty lead', () => {
    const result = computeLeadScore({ id: '1' });
    expect(result.score).toBeLessThan(30);
    expect(result.level).toBe('low');
  });

  it('returns high for hot lead with all signals', () => {
    const result = computeLeadScore({
      id: '2',
      status: 'interested',
      times_contacted: 5,
      last_contacted: new Date().toISOString(),
      last_attended: new Date().toISOString(),
      package_interest_id: 'pkg-1',
      source: 'referral',
      temperature: 'hot',
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toBe('high');
  });

  it('scores referral source higher than social media', () => {
    const referral = computeLeadScore({ id: '3', source: 'referral' });
    const social = computeLeadScore({ id: '4', source: 'social_media' });
    expect(referral.score).toBeGreaterThan(social.score);
  });

  it('scores recent contact higher than old contact', () => {
    const recent = computeLeadScore({
      id: '5',
      last_contacted: new Date().toISOString(),
    });
    const old = computeLeadScore({
      id: '6',
      last_contacted: new Date(Date.now() - 60 * 86_400_000).toISOString(),
    });
    expect(recent.score).toBeGreaterThan(old.score);
  });

  it('clamps score to 0-100', () => {
    const result = computeLeadScore({
      id: '7',
      status: 'converted',
      times_contacted: 10,
      last_contacted: new Date().toISOString(),
      last_attended: new Date().toISOString(),
      package_interest_id: 'pkg-1',
      source: 'referral',
      temperature: 'hot',
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('handles null/undefined fields gracefully', () => {
    const result = computeLeadScore({
      id: '8',
      status: null,
      times_contacted: null,
      last_contacted: null,
      source: null,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
