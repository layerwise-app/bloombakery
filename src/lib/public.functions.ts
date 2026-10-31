import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestUrl } from '@tanstack/react-start/server';
import { env } from 'cloudflare:workers';
import { asc, eq } from 'drizzle-orm';
import { business } from '~/business.config';
import { db } from '~/db';
import { contactMessages, menuItems, quotes, reservations } from '~/db/schema';
import { firstName, maskEmail, photoUrl } from '~/lib/format';
import {
  formatDate,
  isSlotOffered,
  listPickupDays,
  openStatus,
  zonedNow
} from '~/lib/schedule';
import {
  isHoneypotTripped,
  parseContact,
  parseReservation
} from '~/lib/validation';
import type { FieldErrors } from '~/lib/validation';
import { sendOwnerMessageNotice, sendReservationConfirmation } from '~/server/mail';
import { hashKey, hitRateLimit } from '~/server/rate-limit';
import {
  bookedBySlot,
  bookedForSlot,
  createReservationIfRoom,
  tokenPattern
} from '~/server/reservations';
import { loadSettings } from '~/server/settings';

export type FormFailure = {
  ok: false;
  code: 'invalid' | 'rejected' | 'rate_limited' | 'slot_full' | 'slot_closed';
  message: string;
  errors?: FieldErrors;
};

const honeypotFailure: FormFailure = {
  ok: false,
  code: 'rejected',
  message: `We couldn’t accept that form. Please try again, or call us at ${business.contact.phone}.`
};

function salt() {
  return env.BETTER_AUTH_SECRET || 'bloom';
}

function clientIp() {
  return getRequestHeader('cf-connecting-ip') ?? 'unknown';
}

function waitMessage(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  const wait =
    minutes >= 90
      ? `${Math.ceil(minutes / 60)} hours`
      : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  return `That’s a lot of requests in a short time. Please try again in about ${wait}, or call us at ${business.contact.phone}.`;
}

const publicMenuColumns = {
  id: menuItems.id,
  category: menuItems.category,
  name: menuItems.name,
  description: menuItems.description,
  priceCents: menuItems.priceCents,
  dietary: menuItems.dietary,
  art: menuItems.art,
  photoKey: menuItems.photoKey,
  soldOut: menuItems.soldOut,
  featured: menuItems.featured
};

async function readMenu() {
  const rows = await db
    .select(publicMenuColumns)
    .from(menuItems)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  return rows.map(({ photoKey, ...item }) => ({
    ...item,
    photoUrl: photoUrl(photoKey)
  }));
}

export type PublicMenuItem = Awaited<ReturnType<typeof readMenu>>[number];

/** Hours and today's status, used in the header and footer of every page. */
export const getSiteInfo = createServerFn({ method: 'GET' }).handler(async () => {
  const { hours } = await loadSettings(db);
  const now = new Date();
  const today = zonedNow(now, business.timeZone);
  return {
    hours,
    status: openStatus(hours, now, business.timeZone),
    todayLabel: formatDate(today.date),
    todayShort: formatDate(today.date, 'medium'),
    todayWeekday: today.weekday
  };
});

export const getHomePage = createServerFn({ method: 'GET' }).handler(async () => {
  const [settings, menu, quoteRows] = await Promise.all([
    loadSettings(db),
    readMenu(),
    db
      .select({
        id: quotes.id,
        quote: quotes.quote,
        author: quotes.author,
        detail: quotes.detail
      })
      .from(quotes)
      .orderBy(asc(quotes.sortOrder))
  ]);
  const nextPickup = listPickupDays(
    settings.pickup,
    settings.hours,
    new Date(),
    business.timeZone
  )[0];
  return {
    featured: menu.filter((item) => item.featured).slice(0, 4),
    quotes: quoteRows,
    box: settings.box,
    hours: settings.hours,
    nextPickupDate: nextPickup?.date ?? null
  };
});

export const getMenuPage = createServerFn({ method: 'GET' }).handler(async () => ({
  items: await readMenu()
}));

export const getVisitPage = createServerFn({ method: 'GET' }).handler(async () => {
  const { hours } = await loadSettings(db);
  return { hours };
});

/** Pickup days with what's left in each slot. Never includes who booked. */
export const getWeekendBoxPage = createServerFn({ method: 'GET' }).handler(
  async () => {
    const settings = await loadSettings(db);
    const days = listPickupDays(
      settings.pickup,
      settings.hours,
      new Date(),
      business.timeZone
    );
    const first = days[0]?.date ?? '';
    const last = days.at(-1)?.date ?? first;
    const booked = first ? await bookedBySlot(db, first, last) : new Map();
    return {
      box: settings.box,
      maxPerReservation: settings.pickup.maxPerReservation,
      days: days.map((day) => ({
        date: day.date,
        slots: day.times.map((time) => ({
          time,
          remaining: Math.max(
            settings.pickup.capacityPerSlot -
              (booked.get(`${day.date} ${time}`) ?? 0),
            0
          )
        }))
      }))
    };
  }
);

export const submitReservation = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => raw)
  .handler(
    async ({ data: raw }): Promise<{ ok: true; token: string } | FormFailure> => {
      if (isHoneypotTripped(raw)) return honeypotFailure;

      const parsed = parseReservation(raw);
      if (!parsed.ok) {
        return {
          ok: false,
          code: 'invalid',
          message: 'Please check the highlighted fields.',
          errors: parsed.errors
        };
      }
      const input = parsed.data;

      const ipLimit = await hitRateLimit(
        db,
        `reservation:ip:${await hashKey(clientIp(), salt())}`,
        business.limits.reservationsPerHour,
        3600
      );
      if (!ipLimit.allowed) {
        return {
          ok: false,
          code: 'rate_limited',
          message: waitMessage(ipLimit.retryAfterSeconds)
        };
      }

      const settings = await loadSettings(db);
      const now = new Date();

      if (input.quantity > settings.pickup.maxPerReservation) {
        return {
          ok: false,
          code: 'invalid',
          message: `We can hold up to ${settings.pickup.maxPerReservation} boxes per reservation. For a bigger order, call us at ${business.contact.phone}.`,
          errors: {
            quantity: `Choose ${settings.pickup.maxPerReservation} or fewer.`
          }
        };
      }

      if (
        !isSlotOffered(
          input.date,
          input.time,
          settings.pickup,
          settings.hours,
          now,
          business.timeZone
        )
      ) {
        return {
          ok: false,
          code: 'slot_closed',
          message:
            'That pickup time is no longer available. Please choose another.'
        };
      }

      const reservation = await createReservationIfRoom(db, input, {
        capacity: settings.pickup.capacityPerSlot,
        unitPriceCents: settings.box.priceCents,
        now
      });

      if (!reservation) {
        const booked = await bookedForSlot(db, input.date, input.time);
        const remaining = Math.max(settings.pickup.capacityPerSlot - booked, 0);
        return {
          ok: false,
          code: 'slot_full',
          message:
            remaining > 0
              ? `Only ${remaining} ${remaining === 1 ? 'box is' : 'boxes are'} left at that time. Choose fewer boxes or another time.`
              : 'That pickup time just filled up. Please choose another.'
        };
      }

      // Counted only once a reservation is really saved, and only limits the
      // email: the customer's box is held either way.
      const emailLimit = await hitRateLimit(
        db,
        `reservation:email:${await hashKey(input.email, salt())}`,
        business.limits.reservationsPerEmailPerDay,
        86_400
      );
      const emailStatus = emailLimit.allowed
        ? await sendReservationConfirmation(
            db,
            {
              name: input.name,
              email: input.email,
              code: reservation.code,
              quantity: input.quantity,
              date: input.date,
              time: input.time,
              unitPriceCents: settings.box.priceCents,
              boxTitle: settings.box.title
            },
            {
              reservation: new URL(
                `/reservation/${reservation.token}`,
                getRequestUrl().origin
              ).toString(),
              site: getRequestUrl().origin
            }
          )
        : 'skipped';

      await db
        .update(reservations)
        .set({ emailStatus })
        .where(eq(reservations.id, reservation.id));

      return { ok: true, token: reservation.token };
    }
  );

/** Only ever looked up by its secret token, and leaves out the phone number. */
export const getReservation = createServerFn({ method: 'GET' })
  .validator((input: { token: string }) => ({ token: String(input.token) }))
  .handler(async ({ data }) => {
    if (!tokenPattern.test(data.token)) return null;
    const [row] = await db
      .select({
        code: reservations.code,
        name: reservations.name,
        email: reservations.email,
        quantity: reservations.quantity,
        pickupDate: reservations.pickupDate,
        pickupTime: reservations.pickupTime,
        unitPriceCents: reservations.unitPriceCents,
        status: reservations.status,
        emailStatus: reservations.emailStatus
      })
      .from(reservations)
      .where(eq(reservations.token, data.token))
      .limit(1);
    if (!row) return null;
    const { name, email, ...rest } = row;
    const today = zonedNow(new Date(), business.timeZone).date;
    return {
      ...rest,
      firstName: firstName(name),
      maskedEmail: maskEmail(email),
      canCancel:
        (row.status === 'new' || row.status === 'ready') &&
        row.pickupDate >= today
    };
  });

export const cancelReservation = createServerFn({ method: 'POST' })
  .validator((input: { token: string }) => ({ token: String(input.token) }))
  .handler(async ({ data }) => {
    if (!tokenPattern.test(data.token)) return { ok: false as const };
    const [row] = await db
      .select({
        status: reservations.status,
        pickupDate: reservations.pickupDate
      })
      .from(reservations)
      .where(eq(reservations.token, data.token))
      .limit(1);
    const today = zonedNow(new Date(), business.timeZone).date;
    if (
      !row ||
      (row.status !== 'new' && row.status !== 'ready') ||
      row.pickupDate < today
    ) {
      return { ok: false as const };
    }
    await db
      .update(reservations)
      .set({ status: 'canceled', updatedAt: new Date() })
      .where(eq(reservations.token, data.token));
    return { ok: true as const };
  });

export const submitContactMessage = createServerFn({ method: 'POST' })
  .validator((raw: unknown) => raw)
  .handler(async ({ data: raw }): Promise<{ ok: true } | FormFailure> => {
    if (isHoneypotTripped(raw)) return honeypotFailure;

    const parsed = parseContact(raw);
    if (!parsed.ok) {
      return {
        ok: false,
        code: 'invalid',
        message: 'Please check the highlighted fields.',
        errors: parsed.errors
      };
    }

    const limit = await hitRateLimit(
      db,
      `contact:ip:${await hashKey(clientIp(), salt())}`,
      business.limits.messagesPerHour,
      3600
    );
    if (!limit.allowed) {
      return {
        ok: false,
        code: 'rate_limited',
        message: waitMessage(limit.retryAfterSeconds)
      };
    }

    await db.insert(contactMessages).values(parsed.data);

    // The message is saved, so an email problem shouldn't fail the visitor.
    const origin = getRequestUrl().origin;
    await sendOwnerMessageNotice(db, parsed.data, {
      messages: new URL('/dashboard/messages', origin).toString(),
      site: origin
    });

    return { ok: true };
  });
