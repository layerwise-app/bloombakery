// Input checks for the public forms. The server always runs these, because a
// server function can be called without ever loading the page.

import { reservationStatuses, menuCategories } from '~/db/schema';
import type { MenuCategory, ReservationStatus } from '~/db/schema';
import type { DayHours } from '~/business.config';

export type FieldErrors = Record<string, string>;

export type Parsed<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Trims and removes line breaks and control characters from one-line text. */
function cleanLine(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanEmail(value: unknown) {
  return cleanLine(value, 254).toLowerCase();
}

function phoneError(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Enter a phone number we can reach you on.';
  }
  return null;
}

function record(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

/** True when the hidden field that people never see was filled in, or removed. */
export function isHoneypotTripped(raw: unknown) {
  return record(raw).website !== '';
}

export type ReservationInput = {
  date: string;
  time: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
};

export function parseReservation(raw: unknown): Parsed<ReservationInput> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const date = typeof input.date === 'string' ? input.date : '';
  if (!datePattern.test(date)) errors.date = 'Choose a pickup day.';

  const time = typeof input.time === 'string' ? input.time : '';
  if (!timePattern.test(time)) errors.time = 'Choose a pickup time.';

  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Choose how many boxes you would like.';
  }

  const name = cleanLine(input.name, 80);
  if (name.length < 2) errors.name = 'Enter the name for the pickup.';

  const email = cleanEmail(input.email);
  if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';

  const phone = cleanLine(input.phone, 32);
  const phoneProblem = phoneError(phone);
  if (phoneProblem) errors.phone = phoneProblem;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { date, time, quantity, name, email, phone } };
}

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function parseContact(raw: unknown): Parsed<ContactInput> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const name = cleanLine(input.name, 80);
  if (name.length < 2) errors.name = 'Enter your name.';

  const email = cleanEmail(input.email);
  if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';

  const phone = cleanLine(input.phone, 32);
  if (phone) {
    const phoneProblem = phoneError(phone);
    if (phoneProblem) errors.phone = phoneProblem;
  }

  const message =
    typeof input.message === 'string' ? input.message.trim().slice(0, 4000) : '';
  if (message.length < 5) errors.message = 'Tell us a little more.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, phone, message } };
}

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return reservationStatuses.includes(value as ReservationStatus);
}

export type MenuItemInput = {
  id: string | null;
  category: MenuCategory;
  name: string;
  description: string;
  priceCents: number;
  dietary: string[];
  art: string;
  soldOut: boolean;
  featured: boolean;
};

export function parseMenuItem(raw: unknown): Parsed<MenuItemInput> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const name = cleanLine(input.name, 80);
  if (name.length < 2) errors.name = 'Enter a name.';

  const category = input.category as MenuCategory;
  if (!menuCategories.includes(category)) errors.category = 'Choose a category.';

  const priceCents = Number(input.priceCents);
  if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100_000) {
    errors.priceCents = 'Enter a price, like 4.50.';
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      id: typeof input.id === 'string' ? input.id : null,
      category,
      name,
      description:
        typeof input.description === 'string'
          ? input.description.trim().slice(0, 300)
          : '',
      priceCents,
      dietary: Array.isArray(input.dietary)
        ? input.dietary
            .map((label) => cleanLine(label, 30))
            .filter(Boolean)
            .slice(0, 6)
        : [],
      art: cleanLine(input.art, 30) || 'boule',
      soldOut: input.soldOut === true,
      featured: input.featured === true
    }
  };
}

export function parseHours(raw: unknown): Parsed<Record<number, DayHours>> {
  const input = record(raw);
  const hours: Record<number, DayHours> = {};
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const day = input[weekday] as { open?: unknown; close?: unknown } | null;
    if (day === null || day === undefined) {
      hours[weekday] = null;
      continue;
    }
    const { open, close } = day;
    if (
      typeof open !== 'string' ||
      typeof close !== 'string' ||
      !timePattern.test(open) ||
      !timePattern.test(close) ||
      open >= close
    ) {
      return {
        ok: false,
        errors: { [weekday]: 'Closing time must be after opening time.' }
      };
    }
    hours[weekday] = { open, close };
  }
  return { ok: true, data: hours };
}

export type PickupSettingsInput = {
  days: number[];
  times: string[];
  capacityPerSlot: number;
};

export function parsePickupSettings(raw: unknown): Parsed<PickupSettingsInput> {
  const input = record(raw);
  const errors: FieldErrors = {};

  const capacityPerSlot = Number(input.capacityPerSlot);
  if (
    !Number.isInteger(capacityPerSlot) ||
    capacityPerSlot < 0 ||
    capacityPerSlot > 500
  ) {
    errors.capacityPerSlot = 'Enter a whole number of boxes, 0 or more.';
  }

  const days = Array.isArray(input.days)
    ? [...new Set(input.days.map(Number))].filter(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6
      )
    : [];

  const times = Array.isArray(input.times)
    ? [
        ...new Set(
          input.times.filter(
            (time): time is string =>
              typeof time === 'string' && timePattern.test(time)
          )
        )
      ].sort()
    : [];

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { days, times, capacityPerSlot } };
}
