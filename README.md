# Bloom Bakery

<a href="https://layerwise.app"><img src="https://layerwise.app/powered-by.png" alt="Powered by Layerwise" width="320" /></a>

A complete website for a neighborhood bakery: a home page, a menu, weekend box
reservations with pickup capacity, a visit page with a contact form, and an
owner dashboard. Everything about the business is fictional and easy to replace.

## Make it yours

**Start with [`src/business.config.ts`](src/business.config.ts).** One file holds
the business name, tagline, contact details, hours, colors, social links, owner
list, pickup rules, and your story. Pages, emails, search tags, structured data,
and the illustrations all read from it.

1. Change the name, tagline, contact details, hours, colors, and social links.
2. **Replace `owners` and `notifyEmail` with your own email address.** Until you
   do, nobody can open the real dashboard on the published site, and contact
   form notifications aren't sent, because the sample addresses can't receive
   mail. Messages are still saved.
3. Publish, go to `/sign-in`, and sign in with the code emailed to your address.
4. In the dashboard, edit the menu, upload your photos, and set the weekend box.
5. Set `demoDashboard: false` to remove the public demo.

The share image (`public/og-image.png`) and icons in `public/` are ordinary
files. Replace them when you change the name or colors. `site.url` in
`src/lib/site.ts` is where a custom domain goes.

### What lives where

| What                                             | Where                                                |
| ------------------------------------------------ | ---------------------------------------------------- |
| Name, contact, colors, social links, owner list  | `src/business.config.ts`                             |
| Hours, pickup times, and capacity                | Starts in the config. Once saved in the dashboard, the saved values win |
| Menu, quotes, and weekend box                    | The database, seeded by a migration and edited in the dashboard (quotes in the `quotes` table) |
| Menu photos                                      | Layerwise Storage, under `menu/`                     |

## How it works

- **Reservations.** The capacity check is part of the `INSERT` statement in
  `src/server/reservations.ts`, so it's atomic: two people can't take the last
  box however close together they submit. Customers get a confirmation email and
  a private link, where they can also cancel. They pay in store.
- **Owner access.** Every dashboard server function runs `ownerMiddleware`. An
  account needs a verified email on the `owners` list. Sign-up is closed, and
  sign-in codes are only ever sent to listed addresses.
- **Demo dashboard.** `/demo` uses the same screens with the sample data in
  `src/lib/demo-data.ts`. Its pages never touch the database, and every control
  is disabled.
- **Public forms.** These have a hidden honeypot field, per-visitor rate limits
  stored in the database, a limit on confirmation emails per address, and a
  daily cap on all email. See `limits` in the config.
- **Time zones.** Dates and times are wall-clock values in the bakery's
  `timeZone`, wherever the Worker runs.

## Commands

```bash
pnpm dev
pnpm check-types
pnpm test
pnpm build
pnpm auth:generate
pnpm db:generate --name <migration_name>
pnpm db:migrate
pnpm cf-typegen
pnpm release
```

`db:migrate` applies generated Drizzle migrations to the local D1 database.
Layerwise applies the same migrations to the project's production D1 database
during publishing, including the seed in `drizzle/*_seed_menu_and_content`.
`pnpm test` runs unit tests, plus capacity and rate limit tests against a
temporary local D1 database with the real migrations applied.

## Important files

- `src/business.config.ts`: everything about the business
- `src/routes/_site/`: the public pages
- `src/routes/dashboard/` and `src/routes/demo/`: the owner and demo dashboards,
  which share `src/components/dashboard/`
- `src/lib/public.functions.ts` and `src/lib/owner.functions.ts`: server functions
- `src/server/`: capacity, rate limits, settings, and email templates
- `src/components/art.tsx`: the original illustrations, drawn as inline SVG
- `src/lib/sample-content.ts`: the starting menu, quotes, and weekend box
- `src/db/schema.ts`: Drizzle schema
- `src/lib/auth.ts`: Better Auth server configuration
- `src/lib/site.ts` and `src/utils/seo.ts`: search and sharing

## Storage

Server code stores files with `env.STORAGE` from `cloudflare:workers`. Menu
photos are saved under `menu/` and served from this site at `/media/*`, which
exposes nothing else in Storage. The local preview and the published app share
the project's one Storage, so files written while testing are real files.

## Search and sharing

Each route sets its head with `seo({ title, description, path })`, which adds
the canonical URL and the link-preview tags that Google, Instagram, iMessage,
and WhatsApp read. The home and Visit pages include `Bakery` structured data
built from the config. `/robots.txt` and `/sitemap.xml` are generated from
`src/lib/site.ts`.

## Email

Server code sends transactional email with `env.EMAIL.send()`: reservation
confirmations and contact form notices, in `src/server/mail.ts`. The local
preview never sends real email; messages and sign-in codes appear under
Email → Local in the Layerwise app. Published apps send from the project's
address after the first publish.

Keep secrets server-side. Variables prefixed with `VITE_` are included in the
browser bundle. `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `AUTH_EMAIL_URL`
belong in the Worker environment.
