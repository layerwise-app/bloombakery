import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Better Auth tables. After adding an auth plugin, run
// `pnpm run auth:generate --yes`, copy only its new tables and columns from the
// generated `auth-schema.ts` into this section, then delete that file.

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  role: text('role'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' })
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by')
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp'
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp'
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
});

// Bloom Bakery tables.

export const menuCategories = ['breads', 'pastries', 'coffee'] as const;
export type MenuCategory = (typeof menuCategories)[number];

export const menuItems = sqliteTable(
  'menu_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    category: text('category').$type<MenuCategory>().notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    priceCents: integer('price_cents').notNull(),
    dietary: text('dietary', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default([]),
    // Illustration name from `src/components/art.tsx`, used when no photo is set.
    art: text('art').notNull().default('loaf'),
    // Layerwise Storage key under `menu/`, served by `/media/*`.
    photoKey: text('photo_key'),
    soldOut: integer('sold_out', { mode: 'boolean' }).notNull().default(false),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [index('menu_items_category_idx').on(table.category, table.sortOrder)]
);

export const quotes = sqliteTable('quotes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quote: text('quote').notNull(),
  author: text('author').notNull(),
  detail: text('detail').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0)
});

export const reservationStatuses = [
  'new',
  'ready',
  'picked_up',
  'canceled'
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

export const reservations = sqliteTable(
  'reservations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // The secret in the customer's private confirmation link.
    token: text('token').notNull().unique(),
    // Short reference for the counter, like BB-7K2F.
    code: text('code').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    quantity: integer('quantity').notNull(),
    // Bakery wall-clock date and time, like 2026-11-07 and 09:00.
    pickupDate: text('pickup_date').notNull(),
    pickupTime: text('pickup_time').notNull(),
    // The box price when reserved, so later price changes don't alter it.
    unitPriceCents: integer('unit_price_cents').notNull(),
    status: text('status').$type<ReservationStatus>().notNull().default('new'),
    // sent, failed, or skipped: decides what the confirmation page says.
    emailStatus: text('email_status').notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [
    index('reservations_slot_idx').on(table.pickupDate, table.pickupTime),
    index('reservations_created_idx').on(table.createdAt)
  ]
);

export const contactMessages = sqliteTable(
  'contact_messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    message: text('message').notNull(),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  (table) => [index('contact_messages_created_idx').on(table.createdAt)]
);

// One JSON value per key. A missing key falls back to `business.config.ts`.
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
});

// Fixed-window counters for the public forms. Keys hold hashes, not addresses.
export const rateLimits = sqliteTable(
  'rate_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    windowStart: integer('window_start').notNull()
  },
  (table) => [index('rate_limits_window_idx').on(table.windowStart)]
);
