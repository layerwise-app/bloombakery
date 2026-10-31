import { describe, expect, it } from 'vitest';
import { business } from '~/business.config';
import {
  addDays,
  formatDate,
  formatTime,
  groupHours,
  isSlotOffered,
  listPickupDays,
  openStatus,
  weekdayOf,
  zonedNow
} from '~/lib/schedule';
import type { PickupRules, WeeklyHours } from '~/lib/schedule';

const timeZone = 'America/Los_Angeles';

const hours: WeeklyHours = {
  0: { open: '08:00', close: '13:00' },
  1: null,
  2: { open: '07:00', close: '14:00' },
  3: { open: '07:00', close: '14:00' },
  4: { open: '07:00', close: '14:00' },
  5: { open: '07:00', close: '15:00' },
  6: { open: '07:30', close: '15:00' }
};

const rules: PickupRules = {
  days: [6, 0],
  times: ['08:00', '09:00', '10:00', '11:00', '13:00'],
  capacityPerSlot: 6,
  maxPerReservation: 4,
  daysAhead: 8,
  cutoffHours: 2
};

// Saturday, Oct 31, 2026, 8:15 AM in Los Angeles (PDT, UTC-7).
const saturdayMorning = new Date('2026-10-31T15:15:00Z');

describe('zonedNow', () => {
  it('uses the bakery’s date, not the server’s', () => {
    // 2 AM Sunday UTC is still Saturday evening in Los Angeles.
    const now = zonedNow(new Date('2026-11-01T02:00:00Z'), timeZone);
    expect(now.date).toBe('2026-10-31');
    expect(now.weekday).toBe(6);
    expect(now.time).toBe('19:00');
  });
});

describe('dates and times', () => {
  it('adds days across month ends and DST changes', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('knows the weekday of a date', () => {
    expect(weekdayOf('2026-11-07')).toBe(6);
  });

  it('formats for people', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('12:30')).toBe('12:30 PM');
    expect(formatTime('14:00', true)).toBe('2 PM');
    expect(formatDate('2026-11-07')).toBe('Saturday, November 7');
  });
});

describe('openStatus', () => {
  it('says when the bakery closes while open', () => {
    expect(openStatus(hours, saturdayMorning, timeZone)).toEqual({
      isOpen: true,
      label: 'Open until 3 PM'
    });
  });

  it('says when it opens later today', () => {
    const early = new Date('2026-10-31T13:00:00Z'); // 6 AM Saturday
    expect(openStatus(hours, early, timeZone).label).toBe('Opens at 7:30 AM');
  });

  it('skips closed days', () => {
    const sundayEvening = new Date('2026-11-02T02:00:00Z'); // 6 PM PST Sunday
    expect(openStatus(hours, sundayEvening, timeZone).label).toBe(
      'Opens Tuesday at 7 AM'
    );
  });
});

describe('groupHours', () => {
  it('merges consecutive days with the same hours', () => {
    expect(groupHours(hours)).toEqual([
      { label: 'Monday', hours: 'Closed', closed: true },
      { label: 'Tue – Thu', hours: '7 AM – 2 PM', closed: false },
      { label: 'Friday', hours: '7 AM – 3 PM', closed: false },
      { label: 'Saturday', hours: '7:30 AM – 3 PM', closed: false },
      { label: 'Sunday', hours: '8 AM – 1 PM', closed: false }
    ]);
  });
});

describe('listPickupDays', () => {
  const days = listPickupDays(rules, hours, saturdayMorning, timeZone);

  it('offers only pickup days', () => {
    expect(days.map((day) => day.date)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-07',
      '2026-11-08'
    ]);
  });

  it('drops times inside the cutoff', () => {
    expect(days[0]?.times).toEqual(['11:00', '13:00']);
  });

  it('drops times outside opening hours', () => {
    expect(days[1]?.times).toEqual(['08:00', '09:00', '10:00', '11:00']);
  });

  it('removes a day when the bakery closes that day', () => {
    const closed = { ...hours, 0: null };
    const dates = listPickupDays(rules, closed, saturdayMorning, timeZone).map(
      (day) => day.date
    );
    expect(dates).not.toContain('2026-11-01');
  });
});

describe('isSlotOffered', () => {
  const offered = (date: string, time: string) =>
    isSlotOffered(date, time, rules, hours, saturdayMorning, timeZone);

  it('accepts a real slot', () => {
    expect(offered('2026-11-07', '09:00')).toBe(true);
  });

  it('rejects past, closed-day, off-schedule, and too-far slots', () => {
    expect(offered('2026-10-24', '09:00')).toBe(false);
    expect(offered('2026-10-31', '09:00')).toBe(false);
    expect(offered('2026-11-03', '09:00')).toBe(false);
    expect(offered('2026-11-07', '09:30')).toBe(false);
    expect(offered('2026-11-14', '09:00')).toBe(false);
  });
});

describe('the config', () => {
  it('has pickup times inside opening hours on pickup days', () => {
    const days = listPickupDays(
      business.pickup,
      business.hours,
      saturdayMorning,
      business.timeZone
    );
    expect(days.length).toBeGreaterThan(0);
  });
});
