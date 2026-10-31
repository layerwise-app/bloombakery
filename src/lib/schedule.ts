// Opening hours and pickup slots. All dates and times are wall-clock values in
// the bakery's time zone (`2026-11-07` and `09:00`), which keeps "today" and
// daylight saving correct no matter where the Worker runs.

import type { DayHours } from '~/business.config';

export type WeeklyHours = Record<number, DayHours>;

export type PickupRules = {
  days: number[];
  times: string[];
  capacityPerSlot: number;
  maxPerReservation: number;
  daysAhead: number;
  cutoffHours: number;
};

export type PickupDay = { date: string; times: string[] };

const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export function dayName(weekday: number) {
  return dayNames[weekday] ?? '';
}

export function zonedNow(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value ?? '00';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return { date, time: `${part('hour')}:${part('minute')}`, weekday: weekdayOf(date) };
}

function dateToUtc(date: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function weekdayOf(date: string) {
  return new Date(dateToUtc(date)).getUTCDay();
}

export function addDays(date: string, days: number) {
  return new Date(dateToUtc(date) + days * 86_400_000).toISOString().slice(0, 10);
}

export function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** `09:00` to `9:00 AM`; `compact` gives `9 AM`. */
export function formatTime(time: string, compact = false) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  if (compact && minutes === 0) return `${hour} ${suffix}`;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** `2026-11-07` to `Saturday, November 7`. */
export function formatDate(
  date: string,
  style: 'long' | 'medium' | 'short' = 'long'
) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    ...(style === 'long' ? { weekday: 'long' } : {}),
    ...(style === 'medium' ? { weekday: 'short' } : {})
  };
  return new Intl.DateTimeFormat('en-US', options).format(dateToUtc(date));
}

export function formatRange(hours: NonNullable<DayHours>) {
  return `${formatTime(hours.open, true)} – ${formatTime(hours.close, true)}`;
}

/** What the header shows right now, like `Open until 2 PM`. */
export function openStatus(hours: WeeklyHours, now: Date, timeZone: string) {
  const { weekday, time } = zonedNow(now, timeZone);
  const current = timeToMinutes(time);
  const today = hours[weekday];
  if (
    today &&
    current >= timeToMinutes(today.open) &&
    current < timeToMinutes(today.close)
  ) {
    return { isOpen: true, label: `Open until ${formatTime(today.close, true)}` };
  }
  if (today && current < timeToMinutes(today.open)) {
    return { isOpen: false, label: `Opens at ${formatTime(today.open, true)}` };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const next = (weekday + offset) % 7;
    const day = hours[next];
    if (day) {
      const when = offset === 1 ? 'tomorrow' : dayName(next);
      return {
        isOpen: false,
        label: `Opens ${when} at ${formatTime(day.open, true)}`
      };
    }
  }
  return { isOpen: false, label: 'Closed' };
}

/** Consecutive days with matching hours, Monday first, like `Tue – Thu`. */
export function groupHours(hours: WeeklyHours) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups: { days: number[]; value: DayHours }[] = [];
  for (const weekday of order) {
    const value = hours[weekday] ?? null;
    const last = groups.at(-1);
    if (last && JSON.stringify(last.value) === JSON.stringify(value)) {
      last.days.push(weekday);
    } else {
      groups.push({ days: [weekday], value });
    }
  }
  return groups.map(({ days, value }) => {
    const first = dayName(days[0] ?? 0);
    const last = dayName(days.at(-1) ?? 0);
    return {
      label: days.length === 1 ? first : `${first.slice(0, 3)} – ${last.slice(0, 3)}`,
      hours: value ? formatRange(value) : 'Closed',
      closed: !value
    };
  });
}

function wallClockMinutes(date: string, time: string) {
  return dateToUtc(date) / 60_000 + timeToMinutes(time);
}

function timesForDate(date: string, rules: PickupRules, hours: WeeklyHours) {
  const weekday = weekdayOf(date);
  const today = hours[weekday];
  if (!today || !rules.days.includes(weekday)) return [];
  const open = timeToMinutes(today.open);
  const close = timeToMinutes(today.close);
  return [...rules.times]
    .sort()
    .filter((time) => {
      const minutes = timeToMinutes(time);
      return minutes >= open && minutes < close;
    });
}

/** Every pickup slot that can still be reserved, soonest first. */
export function listPickupDays(
  rules: PickupRules,
  hours: WeeklyHours,
  now: Date,
  timeZone: string
): PickupDay[] {
  const current = zonedNow(now, timeZone);
  const earliest =
    wallClockMinutes(current.date, current.time) + rules.cutoffHours * 60;
  const days: PickupDay[] = [];
  for (let offset = 0; offset <= rules.daysAhead; offset += 1) {
    const date = addDays(current.date, offset);
    const times = timesForDate(date, rules, hours).filter(
      (time) => wallClockMinutes(date, time) >= earliest
    );
    if (times.length) days.push({ date, times });
  }
  return days;
}

/** The server's check that a submitted slot is one the bakery really offers. */
export function isSlotOffered(
  date: string,
  time: string,
  rules: PickupRules,
  hours: WeeklyHours,
  now: Date,
  timeZone: string
) {
  return listPickupDays(rules, hours, now, timeZone).some(
    (day) => day.date === date && day.times.includes(time)
  );
}
