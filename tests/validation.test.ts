import { describe, expect, it } from 'vitest';
import { formatPrice, maskEmail } from '~/lib/format';
import { isOwner, isOwnerEmail } from '~/lib/owners';
import {
  isHoneypotTripped,
  parseContact,
  parseHours,
  parseMenuItem,
  parsePickupSettings,
  parseReservation
} from '~/lib/validation';

const reservation = {
  date: '2026-11-07',
  time: '09:00',
  quantity: 2,
  name: 'Jane Doe',
  email: 'Jane@Example.com',
  phone: '(503) 555-0100'
};

describe('honeypot', () => {
  it('passes an empty field', () => {
    expect(isHoneypotTripped({ website: '' })).toBe(false);
  });

  it('trips when filled, or when a script leaves it out', () => {
    expect(isHoneypotTripped({ website: 'https://spam.test' })).toBe(true);
    expect(isHoneypotTripped({})).toBe(true);
    expect(isHoneypotTripped(null)).toBe(true);
  });
});

describe('parseReservation', () => {
  it('accepts and normalizes good input', () => {
    const parsed = parseReservation(reservation);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.email).toBe('jane@example.com');
  });

  it('strips line breaks from one-line fields', () => {
    const parsed = parseReservation({
      ...reservation,
      name: 'Jane\r\nBcc: someone@example.com'
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.name).not.toMatch(/[\r\n]/);
  });

  it.each([
    ['date', { date: 'soon' }],
    ['time', { time: '9am' }],
    ['time', { time: '25:00' }],
    ['quantity', { quantity: 0 }],
    ['quantity', { quantity: 1.5 }],
    ['name', { name: ' ' }],
    ['email', { email: 'not-an-email' }],
    ['email', { email: 'a@b' }],
    ['phone', { phone: '123' }]
  ])('rejects a bad %s', (field, change) => {
    const parsed = parseReservation({ ...reservation, ...change });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors[field]).toBeTruthy();
  });

  it('survives garbage', () => {
    expect(parseReservation(undefined).ok).toBe(false);
    expect(parseReservation('hello').ok).toBe(false);
  });
});

describe('parseContact', () => {
  const contact = { name: 'Sam', email: 'sam@example.com', message: 'Hello there' };

  it('accepts a message with no phone', () => {
    expect(parseContact(contact).ok).toBe(true);
  });

  it('rejects an empty message and a bad phone', () => {
    expect(parseContact({ ...contact, message: '' }).ok).toBe(false);
    expect(parseContact({ ...contact, phone: '12' }).ok).toBe(false);
  });
});

describe('owner settings', () => {
  it('rejects hours that close before they open', () => {
    expect(parseHours({ 2: { open: '14:00', close: '07:00' } }).ok).toBe(false);
  });

  it('treats a missing day as closed', () => {
    const parsed = parseHours({ 2: { open: '07:00', close: '14:00' } });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data[1]).toBeNull();
  });

  it('dedupes and sorts pickup times, and rejects a bad capacity', () => {
    const parsed = parsePickupSettings({
      capacityPerSlot: 4,
      days: [6, 6, 9],
      times: ['10:00', '08:00', '10:00', 'nope']
    });
    expect(parsed).toEqual({
      ok: true,
      data: { capacityPerSlot: 4, days: [6], times: ['08:00', '10:00'] }
    });
    expect(parsePickupSettings({ capacityPerSlot: -1 }).ok).toBe(false);
  });

  it('checks menu items', () => {
    const item = { name: 'Rye', category: 'breads', priceCents: 900 };
    expect(parseMenuItem(item).ok).toBe(true);
    expect(parseMenuItem({ ...item, category: 'soup' }).ok).toBe(false);
    expect(parseMenuItem({ ...item, priceCents: -1 }).ok).toBe(false);
  });
});

describe('owner list', () => {
  const owners = ['owner@bakery.test'];

  it('matches regardless of case', () => {
    expect(isOwnerEmail('OWNER@bakery.test', owners)).toBe(true);
    expect(isOwnerEmail('stranger@bakery.test', owners)).toBe(false);
  });

  it('requires a verified address, so a listed email can’t just be claimed', () => {
    expect(isOwner({ email: 'owner@bakery.test', emailVerified: true }, owners)).toBe(true);
    expect(isOwner({ email: 'owner@bakery.test', emailVerified: false }, owners)).toBe(false);
    expect(isOwner({ email: 'stranger@bakery.test', emailVerified: true }, owners)).toBe(false);
  });
});

describe('formatting', () => {
  it('formats prices like a menu', () => {
    expect(formatPrice(900)).toBe('$9');
    expect(formatPrice(450)).toBe('$4.50');
    expect(formatPrice(500)).toBe('$5');
  });

  it('masks email addresses', () => {
    expect(maskEmail('jane@example.com')).toBe('j•••@example.com');
  });
});
