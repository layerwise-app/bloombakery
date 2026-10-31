import { business } from '~/business.config';
import { settings } from '~/db/schema';
import { sampleWeekendBox } from '~/lib/sample-content';
import type { WeekendBox } from '~/lib/sample-content';
import type { PickupRules, WeeklyHours } from '~/lib/schedule';
import type { PickupSettingsInput } from '~/lib/validation';
import type { Db } from '~/server/rate-limit';

export type SiteSettings = {
  hours: WeeklyHours;
  pickup: PickupRules;
  box: WeekendBox;
};

/** Saved dashboard settings, falling back to `business.config.ts`. */
export async function loadSettings(db: Db): Promise<SiteSettings> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings);
  const saved = new Map(rows.map((row) => [row.key, row.value]));

  const pickup = saved.get('pickup') as PickupSettingsInput | undefined;

  return {
    hours: (saved.get('hours') as WeeklyHours | undefined) ?? business.hours,
    pickup: { ...business.pickup, ...pickup },
    box: (saved.get('weekendBox') as WeekendBox | undefined) ?? sampleWeekendBox
  };
}

export async function saveSetting(db: Db, key: string, value: unknown) {
  const updatedAt = new Date();
  await db
    .insert(settings)
    .values({ key, value, updatedAt })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt } });
}
