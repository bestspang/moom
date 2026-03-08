import { describe, it, expect } from 'vitest';
import { getBangkokDayRange, getBangkokDayStart } from './dateRange';

describe('getBangkokDayRange', () => {
  it('returns correct range for a given date', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    const range = getBangkokDayRange(date);
    expect(range.start).toBe('2025-01-15T00:00:00+07:00');
    expect(range.end).toBe('2025-01-16T00:00:00+07:00');
  });

  it('handles end of month correctly', () => {
    const date = new Date(2025, 0, 31); // Jan 31
    const range = getBangkokDayRange(date);
    expect(range.start).toBe('2025-01-31T00:00:00+07:00');
    expect(range.end).toBe('2025-02-01T00:00:00+07:00');
  });

  it('handles leap year Feb 29', () => {
    const date = new Date(2024, 1, 29); // Feb 29, 2024
    const range = getBangkokDayRange(date);
    expect(range.start).toBe('2024-02-29T00:00:00+07:00');
    expect(range.end).toBe('2024-03-01T00:00:00+07:00');
  });
});

describe('getBangkokDayStart', () => {
  it('returns correct start of day', () => {
    const date = new Date(2025, 5, 10); // Jun 10
    const result = getBangkokDayStart(date);
    expect(result).toBe('2025-06-10T00:00:00+07:00');
  });
});
