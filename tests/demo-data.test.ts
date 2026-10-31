import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  demoAllReservations,
  demoMessages,
  demoToday
} from '~/lib/demo-data';
import { reservationStatuses } from '~/db/schema';

describe('demo dashboard data', () => {
  it('uses only reserved, fictional contact details', () => {
    const people = [
      ...demoAllReservations().reservations,
      ...demoMessages().messages
    ];
    for (const person of people) {
      expect(person.email).toMatch(/@example\.com$/);
      if (person.phone) expect(person.phone).toMatch(/555-01\d\d$/);
    }
  });

  it('shows every status, and pickups for today', () => {
    const statuses = new Set(
      demoAllReservations().reservations.map((row) => row.status)
    );
    for (const status of reservationStatuses) {
      expect(statuses.has(status)).toBe(true);
    }
    expect(demoToday().pickups.length).toBeGreaterThan(0);
  });

  it('can’t read the database', () => {
    const files = [
      'src/lib/demo-data.ts',
      'src/routes/demo.tsx',
      'src/routes/demo/index.tsx',
      'src/routes/demo/reservations.tsx',
      'src/routes/demo/messages.tsx',
      'src/routes/demo/menu.tsx',
      'src/routes/demo/settings.tsx'
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from '~\/db'/);
      expect(source).not.toMatch(/owner\.functions/);
      expect(source).not.toMatch(/public\.functions/);
    }
  });
});
