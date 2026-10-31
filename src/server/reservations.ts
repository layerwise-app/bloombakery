import { and, eq, gte, lte, ne, sql } from 'drizzle-orm';
import { reservations } from '~/db/schema';
import type { ReservationStatus } from '~/db/schema';
import type { ReservationInput } from '~/lib/validation';
import type { Db } from '~/server/rate-limit';

const codeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(
    bytes,
    (byte) => codeAlphabet[byte % codeAlphabet.length]
  ).join('');
}

/** The secret in a customer's private link: 192 random bits. */
export function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export const tokenPattern = /^[\w-]{32}$/;

export async function bookedBySlot(db: Db, from: string, to: string) {
  const rows = await db
    .select({
      date: reservations.pickupDate,
      time: reservations.pickupTime,
      booked: sql<number>`COALESCE(SUM(${reservations.quantity}), 0)`
    })
    .from(reservations)
    .where(
      and(
        gte(reservations.pickupDate, from),
        lte(reservations.pickupDate, to),
        ne(reservations.status, 'canceled')
      )
    )
    .groupBy(reservations.pickupDate, reservations.pickupTime);
  return new Map(rows.map((row) => [`${row.date} ${row.time}`, Number(row.booked)]));
}

export async function bookedForSlot(db: Db, date: string, time: string) {
  const [row] = await db
    .select({
      booked: sql<number>`COALESCE(SUM(${reservations.quantity}), 0)`
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.pickupDate, date),
        eq(reservations.pickupTime, time),
        ne(reservations.status, 'canceled')
      )
    );
  return Number(row?.booked ?? 0);
}

/**
 * Saves a reservation only if the slot still has room. The capacity check is
 * part of the INSERT itself, and D1 runs each statement atomically, so two
 * people can't both take the last box however close together they submit.
 * Returns null when the slot is full.
 */
export async function createReservationIfRoom(
  db: Db,
  input: ReservationInput,
  options: { capacity: number; unitPriceCents: number; now?: Date }
) {
  const id = crypto.randomUUID();
  const token = createToken();
  const code = `BB-${randomCode(4)}`;
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);

  const result = await db.run(sql`
    INSERT INTO reservations (
      id, token, code, name, email, phone, quantity, pickup_date, pickup_time,
      unit_price_cents, status, email_status, created_at, updated_at
    )
    SELECT
      ${id}, ${token}, ${code}, ${input.name}, ${input.email}, ${input.phone},
      ${input.quantity}, ${input.date}, ${input.time}, ${options.unitPriceCents},
      'new', 'pending', ${nowSeconds}, ${nowSeconds}
    WHERE (
      SELECT COALESCE(SUM(quantity), 0) FROM reservations
      WHERE pickup_date = ${input.date}
        AND pickup_time = ${input.time}
        AND status <> 'canceled'
    ) + ${input.quantity} <= ${options.capacity}
  `);

  if (!result.meta.changes) return null;
  return { id, token, code };
}

/**
 * Changes a status. Moving a canceled reservation back into the queue takes up
 * capacity again, so that move has the same atomic check as a new booking.
 * Returns false when the reservation is missing or its slot has no room.
 */
export async function updateReservationStatus(
  db: Db,
  id: string,
  status: ReservationStatus,
  capacity: number,
  now = new Date()
) {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const result =
    status === 'canceled'
      ? await db.run(sql`
          UPDATE reservations SET status = ${status}, updated_at = ${nowSeconds}
          WHERE id = ${id}
        `)
      : await db.run(sql`
          UPDATE reservations SET status = ${status}, updated_at = ${nowSeconds}
          WHERE id = ${id} AND (
            status <> 'canceled' OR (
              SELECT COALESCE(SUM(other.quantity), 0) FROM reservations other
              WHERE other.pickup_date = reservations.pickup_date
                AND other.pickup_time = reservations.pickup_time
                AND other.status <> 'canceled'
            ) + quantity <= ${capacity}
          )
        `);
  return Boolean(result.meta.changes);
}
