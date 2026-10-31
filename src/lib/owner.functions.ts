import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { env } from 'cloudflare:workers';
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { business } from '~/business.config';
import { db } from '~/db';
import { contactMessages, menuItems, reservations } from '~/db/schema';
import { auth } from '~/lib/auth';
import { photoUrl } from '~/lib/format';
import { ownerMiddleware } from '~/lib/owner.middleware';
import { isOwner, isOwnerEmail } from '~/lib/owners';
import { zonedNow } from '~/lib/schedule';
import { getStorageErrorCode } from '~/lib/storage';
import {
  isReservationStatus,
  parseHours,
  parseMenuItem,
  parsePickupSettings
} from '~/lib/validation';
import { updateReservationStatus } from '~/server/reservations';
import { loadSettings, saveSetting } from '~/server/settings';

/** Who is asking: decides between the dashboard, sign-in, and "no access". */
export const getOwnerGate = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) return { state: 'signed-out' as const };
  const { email, emailVerified } = session.user;
  if (isOwner(session.user)) return { state: 'owner' as const, email };
  return {
    state: 'denied' as const,
    email,
    needsVerification: !emailVerified && isOwnerEmail(email)
  };
});

const reservationColumns = {
  id: reservations.id,
  code: reservations.code,
  name: reservations.name,
  email: reservations.email,
  phone: reservations.phone,
  quantity: reservations.quantity,
  pickupDate: reservations.pickupDate,
  pickupTime: reservations.pickupTime,
  unitPriceCents: reservations.unitPriceCents,
  status: reservations.status,
  createdAt: reservations.createdAt
};

export const getTodayData = createServerFn({ method: 'GET' })
  .middleware([ownerMiddleware])
  .handler(async () => {
    const today = zonedNow(new Date(), business.timeZone).date;
    const [pickups, [unread]] = await Promise.all([
      db
        .select(reservationColumns)
        .from(reservations)
        .where(eq(reservations.pickupDate, today))
        .orderBy(asc(reservations.pickupTime), asc(reservations.name)),
      db
        .select({ value: count() })
        .from(contactMessages)
        .where(eq(contactMessages.read, false))
    ]);
    return { today, pickups, unreadMessages: unread?.value ?? 0 };
  });

export type DashboardReservation = Awaited<
  ReturnType<typeof getTodayData>
>['pickups'][number];

export const getAllReservations = createServerFn({ method: 'GET' })
  .middleware([ownerMiddleware])
  .handler(async () => ({
    reservations: await db
      .select(reservationColumns)
      .from(reservations)
      .orderBy(
        desc(reservations.pickupDate),
        asc(reservations.pickupTime),
        asc(reservations.name)
      )
      .limit(1000)
  }));

export const setReservationStatus = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string; status: string }) => {
    if (!isReservationStatus(input.status)) throw new Error('Unknown status');
    return { id: String(input.id), status: input.status };
  })
  .handler(async ({ data }) => {
    const { pickup } = await loadSettings(db);
    const changed = await updateReservationStatus(
      db,
      data.id,
      data.status,
      pickup.capacityPerSlot
    );
    if (!changed) {
      throw new Error(
        'That pickup time is full now, so this reservation can’t be reopened.'
      );
    }
  });

export const getMessages = createServerFn({ method: 'GET' })
  .middleware([ownerMiddleware])
  .handler(async () => ({
    messages: await db
      .select({
        id: contactMessages.id,
        name: contactMessages.name,
        email: contactMessages.email,
        phone: contactMessages.phone,
        message: contactMessages.message,
        read: contactMessages.read,
        createdAt: contactMessages.createdAt
      })
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(500)
  }));

export type DashboardMessage = Awaited<
  ReturnType<typeof getMessages>
>['messages'][number];

export const setMessageRead = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string; read: boolean }) => ({
    id: String(input.id),
    read: Boolean(input.read)
  }))
  .handler(async ({ data }) => {
    await db
      .update(contactMessages)
      .set({ read: data.read })
      .where(eq(contactMessages.id, data.id));
  });

export const deleteMessage = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    await db.delete(contactMessages).where(eq(contactMessages.id, data.id));
  });

export const getOwnerMenu = createServerFn({ method: 'GET' })
  .middleware([ownerMiddleware])
  .handler(async () => {
    const rows = await db
      .select({
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
      })
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
    return {
      items: rows.map(({ photoKey, ...item }) => ({
        ...item,
        photoUrl: photoUrl(photoKey)
      }))
    };
  });

export type DashboardMenuItem = Awaited<
  ReturnType<typeof getOwnerMenu>
>['items'][number];

export const saveMenuItem = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((raw: unknown) => {
    const parsed = parseMenuItem(raw);
    if (!parsed.ok) throw new Error(Object.values(parsed.errors)[0]);
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { id, ...values } = data;
    if (id) {
      await db
        .update(menuItems)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(menuItems.id, id));
      return { id };
    }
    const [last] = await db
      .select({ value: sql<number>`COALESCE(MAX(${menuItems.sortOrder}), 0)` })
      .from(menuItems);
    const [created] = await db
      .insert(menuItems)
      .values({ ...values, sortOrder: Number(last?.value ?? 0) + 10 })
      .returning({ id: menuItems.id });
    return { id: created?.id ?? '' };
  });

export const setMenuItemSoldOut = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string; soldOut: boolean }) => ({
    id: String(input.id),
    soldOut: Boolean(input.soldOut)
  }))
  .handler(async ({ data }) => {
    await db
      .update(menuItems)
      .set({ soldOut: data.soldOut, updatedAt: new Date() })
      .where(eq(menuItems.id, data.id));
  });

export const deleteMenuItem = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const [deleted] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, data.id))
      .returning({ photoKey: menuItems.photoKey });
    if (deleted?.photoKey) await env.STORAGE.delete(deleted.photoKey);
  });

const photoTypes = [
  { type: 'image/jpeg', ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  { type: 'image/png', ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'image/webp', ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] }
];
const maxPhotoBytes = 8 * 1024 * 1024;

export const uploadMenuPhoto = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((data: FormData) => {
    const file = data.get('file');
    const id = data.get('id');
    if (!(file instanceof File)) throw new Error('Choose a photo.');
    if (typeof id !== 'string' || !id) throw new Error('Choose a menu item.');
    return { file, id };
  })
  .handler(async ({ data: { file, id } }) => {
    if (file.size > maxPhotoBytes) {
      throw new Error('That photo is over 8 MB. Please choose a smaller one.');
    }
    // Trust the file's first bytes, not the name or type the browser reports.
    const bytes = await file.arrayBuffer();
    const head = new Uint8Array(bytes.slice(0, 4));
    const kind = photoTypes.find(({ magic }) =>
      magic.every((byte, index) => head[index] === byte)
    );
    if (!kind) throw new Error('Please upload a JPG, PNG, or WebP photo.');

    const [item] = await db
      .select({ photoKey: menuItems.photoKey })
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);
    if (!item) throw new Error('That menu item no longer exists.');

    const key = `menu/${id}/${crypto.randomUUID()}.${kind.ext}`;
    try {
      await env.STORAGE.put(key, bytes, {
        contentType: kind.type,
        customMetadata: { name: file.name.slice(0, 200) }
      });
    } catch (error) {
      const code = getStorageErrorCode(error);
      if (code === 'StorageQuotaExceeded') {
        throw new Error('Storage is full. Delete some files and try again.');
      }
      if (code === 'FileTooLarge') {
        throw new Error('That photo is too large for your plan.');
      }
      throw error;
    }

    await db
      .update(menuItems)
      .set({ photoKey: key, updatedAt: new Date() })
      .where(eq(menuItems.id, id));
    if (item.photoKey) await env.STORAGE.delete(item.photoKey);
    return { photoUrl: photoUrl(key) };
  });

export const removeMenuPhoto = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const [item] = await db
      .select({ photoKey: menuItems.photoKey })
      .from(menuItems)
      .where(eq(menuItems.id, data.id))
      .limit(1);
    if (!item?.photoKey) return;
    await db
      .update(menuItems)
      .set({ photoKey: null, updatedAt: new Date() })
      .where(eq(menuItems.id, data.id));
    await env.STORAGE.delete(item.photoKey);
  });

export const getOwnerSettings = createServerFn({ method: 'GET' })
  .middleware([ownerMiddleware])
  .handler(async () => loadSettings(db));

export const saveHours = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((raw: unknown) => {
    const parsed = parseHours(raw);
    if (!parsed.ok) throw new Error(Object.values(parsed.errors)[0]);
    return parsed.data;
  })
  .handler(async ({ data }) => {
    await saveSetting(db, 'hours', data);
  });

export const savePickupSettings = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator((raw: unknown) => {
    const parsed = parsePickupSettings(raw);
    if (!parsed.ok) throw new Error(Object.values(parsed.errors)[0]);
    return parsed.data;
  })
  .handler(async ({ data }) => {
    await saveSetting(db, 'pickup', data);
  });

export const saveWeekendBox = createServerFn({ method: 'POST' })
  .middleware([ownerMiddleware])
  .validator(
    (input: {
      title: string;
      priceCents: number;
      blurb: string;
      items: string[];
    }) => {
      const priceCents = Number(input.priceCents);
      if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new Error('Enter a box price, like 32.00.');
      }
      const title = String(input.title ?? '').trim().slice(0, 80);
      if (!title) throw new Error('Give the box a name.');
      return {
        title,
        priceCents,
        blurb: String(input.blurb ?? '').trim().slice(0, 400),
        items: (Array.isArray(input.items) ? input.items : [])
          .map((item) => String(item).trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 12)
      };
    }
  )
  .handler(async ({ data }) => {
    await saveSetting(db, 'weekendBox', data);
  });
