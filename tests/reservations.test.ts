// Runs against a real local D1 database with the project's real migrations, so
// it also proves the seed works and that capacity holds under concurrency.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { menuItems, quotes, rateLimits, reservations, settings } from '~/db/schema';
import { sampleMenu } from '~/lib/sample-content';
import { hitRateLimit } from '~/server/rate-limit';
import {
  bookedBySlot,
  bookedForSlot,
  createReservationIfRoom,
  updateReservationStatus
} from '~/server/reservations';
import { loadSettings, saveSetting } from '~/server/settings';

const directory = mkdtempSync(join(tmpdir(), 'bloom-test-'));
let platform: Awaited<ReturnType<typeof getPlatformProxy>>;
let db: ReturnType<typeof drizzle>;

const slot = { date: '2026-11-07', time: '09:00' };
const booking = (quantity = 1, overrides = {}) => ({
  ...slot,
  quantity,
  name: 'Test Person',
  email: 'test@example.com',
  phone: '(503) 555-0100',
  ...overrides
});
const options = { capacity: 6, unitPriceCents: 3200 };

beforeAll(async () => {
  platform = await getPlatformProxy({
    configPath: 'wrangler.jsonc',
    remoteBindings: false,
    persist: { path: directory }
  });
  db = drizzle((platform.env as { DB: D1Database }).DB);
  await migrate(db, { migrationsFolder: 'drizzle' });
});

afterAll(async () => {
  await platform?.dispose();
  rmSync(directory, { recursive: true, force: true });
});

describe('seed migration', () => {
  it('fills the menu, so a new site is complete on first load', async () => {
    const rows = await db
      .select({ name: menuItems.name, priceCents: menuItems.priceCents, category: menuItems.category })
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder));
    expect(rows).toHaveLength(sampleMenu.length);
    expect(rows).toContainEqual({ name: 'Sourdough loaf', priceCents: 900, category: 'breads' });
    expect(rows).toContainEqual({ name: 'Butter croissant', priceCents: 450, category: 'pastries' });
    expect(rows).toContainEqual({ name: 'Cinnamon roll', priceCents: 500, category: 'pastries' });
    expect(new Set(rows.map((row) => row.category))).toEqual(
      new Set(['breads', 'pastries', 'coffee'])
    );
  });

  it('adds quotes and the weekend box, and no customer data', async () => {
    expect((await db.select().from(quotes)).length).toBeGreaterThanOrEqual(3);
    const { box } = await loadSettings(db);
    expect(box.items.length).toBeGreaterThan(0);
    expect(await db.select().from(reservations)).toHaveLength(0);
  });
});

describe('settings', () => {
  it('falls back to the config, then prefers saved values', async () => {
    expect((await loadSettings(db)).pickup.capacityPerSlot).toBe(6);
    await saveSetting(db, 'pickup', { capacityPerSlot: 3, days: [6], times: ['09:00'] });
    const saved = (await loadSettings(db)).pickup;
    expect(saved.capacityPerSlot).toBe(3);
    expect(saved.times).toEqual(['09:00']);
    expect(saved.maxPerReservation).toBe(4);
    await db.delete(settings).where(eq(settings.key, 'pickup'));
  });
});

describe('slot capacity', () => {
  beforeEach(async () => {
    await db.delete(reservations);
  });

  it('accepts bookings until the slot is full, then refuses', async () => {
    expect(await createReservationIfRoom(db, booking(4), options)).toBeTruthy();
    expect(await createReservationIfRoom(db, booking(2), options)).toBeTruthy();
    expect(await createReservationIfRoom(db, booking(1), options)).toBeNull();
    expect(await bookedForSlot(db, slot.date, slot.time)).toBe(6);
  });

  it('refuses a booking bigger than what’s left', async () => {
    await createReservationIfRoom(db, booking(5), options);
    expect(await createReservationIfRoom(db, booking(2), options)).toBeNull();
    expect(await createReservationIfRoom(db, booking(1), options)).toBeTruthy();
  });

  it('never overbooks when many people submit at the same moment', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 20 }, () => createReservationIfRoom(db, booking(1), options))
    );
    expect(attempts.filter(Boolean)).toHaveLength(6);
    expect(await bookedForSlot(db, slot.date, slot.time)).toBe(6);
  });

  it('keeps slots separate', async () => {
    await createReservationIfRoom(db, booking(6), options);
    expect(
      await createReservationIfRoom(db, booking(1, { time: '10:00' }), options)
    ).toBeTruthy();
    const booked = await bookedBySlot(db, slot.date, slot.date);
    expect(booked.get(`${slot.date} 09:00`)).toBe(6);
    expect(booked.get(`${slot.date} 10:00`)).toBe(1);
  });

  it('gives each reservation its own unguessable link', async () => {
    const one = await createReservationIfRoom(db, booking(1), options);
    const two = await createReservationIfRoom(db, booking(1), options);
    expect(one?.token).toMatch(/^[\w-]{32}$/);
    expect(one?.token).not.toBe(two?.token);
  });
});

describe('changing status', () => {
  beforeEach(async () => {
    await db.delete(reservations);
  });

  it('frees capacity when a reservation is canceled', async () => {
    const first = await createReservationIfRoom(db, booking(6), options);
    expect(await createReservationIfRoom(db, booking(1), options)).toBeNull();
    await updateReservationStatus(db, first!.id, 'canceled', 6);
    expect(await createReservationIfRoom(db, booking(1), options)).toBeTruthy();
  });

  it('won’t reopen a canceled reservation into a full slot', async () => {
    const first = await createReservationIfRoom(db, booking(2), options);
    await updateReservationStatus(db, first!.id, 'canceled', 6);
    await createReservationIfRoom(db, booking(6), options);
    expect(await updateReservationStatus(db, first!.id, 'new', 6)).toBe(false);
    const [row] = await db
      .select({ status: reservations.status })
      .from(reservations)
      .where(eq(reservations.id, first!.id));
    expect(row?.status).toBe('canceled');
  });

  it('reopens when there is room, and moves through other statuses', async () => {
    const first = await createReservationIfRoom(db, booking(2), options);
    expect(await updateReservationStatus(db, first!.id, 'ready', 6)).toBe(true);
    expect(await updateReservationStatus(db, first!.id, 'picked_up', 6)).toBe(true);
    expect(await updateReservationStatus(db, first!.id, 'canceled', 6)).toBe(true);
    expect(await updateReservationStatus(db, first!.id, 'new', 6)).toBe(true);
    expect(await updateReservationStatus(db, 'missing', 'ready', 6)).toBe(false);
  });
});

describe('rate limits', () => {
  beforeEach(async () => {
    await db.delete(rateLimits);
  });

  it('blocks past the limit and resets after the window', async () => {
    const start = 1_800_000_000_000;
    expect((await hitRateLimit(db, 'k', 2, 60, start)).allowed).toBe(true);
    expect((await hitRateLimit(db, 'k', 2, 60, start + 1000)).allowed).toBe(true);
    const blocked = await hitRateLimit(db, 'k', 2, 60, start + 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(58);
    expect((await hitRateLimit(db, 'k', 2, 60, start + 61_000)).allowed).toBe(true);
  });

  it('counts simultaneous attempts exactly', async () => {
    const start = 1_800_000_000_000;
    const results = await Promise.all(
      Array.from({ length: 10 }, () => hitRateLimit(db, 'burst', 3, 60, start))
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(3);
  });

  it('tracks keys separately', async () => {
    const start = 1_800_000_000_000;
    await hitRateLimit(db, 'a', 1, 60, start);
    expect((await hitRateLimit(db, 'b', 1, 60, start)).allowed).toBe(true);
  });
});
