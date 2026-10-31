// Made-up data for the public, read-only demo dashboard. The demo pages read
// only from this file and never touch the database, so real customer data
// can't appear in them. Dates are relative to today so it always looks current.

import { business } from '~/business.config';
import type { MenuCategory, ReservationStatus } from '~/db/schema';
import {
  sampleMenu,
  sampleWeekendBox
} from '~/lib/sample-content';
import { addDays, zonedNow } from '~/lib/schedule';

type Sample = [
  name: string,
  dayOffset: number,
  time: string,
  quantity: number,
  status: ReservationStatus
];

const samples: Sample[] = [
  ['Maya Robinson', 0, '08:00', 1, 'picked_up'],
  ['Tom Hughes', 0, '08:00', 2, 'picked_up'],
  ['Priya Natarajan', 0, '09:00', 1, 'ready'],
  ['Daniel Osei', 0, '09:00', 1, 'ready'],
  ['Sofia Marquez', 0, '09:00', 3, 'new'],
  ['Hannah Lindqvist', 0, '10:00', 2, 'new'],
  ['Ben Abernathy', 0, '10:00', 1, 'new'],
  ['Grace Kim', 0, '11:00', 1, 'canceled'],
  ['Ravi Shah', 0, '11:00', 2, 'new'],
  ['Elena Petrova', 0, '12:00', 1, 'new'],
  ['Marcus Bell', 1, '08:00', 1, 'new'],
  ['Amara Okafor', 1, '09:00', 2, 'new'],
  ['Liam O’Connor', 1, '09:00', 1, 'new'],
  ['Yuki Tanaka', 1, '10:00', 4, 'new'],
  ['Nora Haddad', 7, '09:00', 1, 'new'],
  ['Owen Fisher', 7, '11:00', 2, 'new'],
  ['Clara Jensen', -1, '09:00', 1, 'picked_up'],
  ['Andre Silva', -1, '10:00', 2, 'picked_up'],
  ['Mei Chen', -1, '11:00', 1, 'canceled'],
  ['Jonah Weiss', -6, '08:00', 2, 'picked_up'],
  ['Isla Murphy', -6, '09:00', 1, 'picked_up']
];

function today() {
  return zonedNow(new Date(), business.timeZone).date;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000);
}

function demoReservations() {
  const date = today();
  return samples.map(([name, dayOffset, time, quantity, status], index) => ({
    id: `demo-${index + 1}`,
    code: `BB-${(310_000 + index * 41_507).toString(36).toUpperCase()}`,
    name,
    email: `${name.split(' ')[0]?.toLowerCase()}@example.com`,
    phone: `(503) 555-01${String(10 + index).padStart(2, '0')}`,
    quantity,
    pickupDate: addDays(date, dayOffset),
    pickupTime: time,
    unitPriceCents: sampleWeekendBox.priceCents,
    status,
    createdAt: hoursAgo(30 + index * 7)
  }));
}

export function demoToday() {
  const date = today();
  return {
    today: date,
    pickups: demoReservations()
      .filter((reservation) => reservation.pickupDate === date)
      .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime)),
    unreadMessages: 2
  };
}

export function demoAllReservations() {
  return {
    reservations: demoReservations().sort(
      (a, b) =>
        b.pickupDate.localeCompare(a.pickupDate) ||
        a.pickupTime.localeCompare(b.pickupTime)
    )
  };
}

export function demoMessages() {
  return {
    messages: [
      {
        id: 'demo-message-1',
        name: 'Jess Alvarez',
        email: 'jess@example.com',
        phone: '(503) 555-0171',
        message:
          'Hi! Could you do a dozen croissants for an office breakfast next Thursday around 8? Happy to pay ahead. Thanks!',
        read: false,
        createdAt: hoursAgo(2)
      },
      {
        id: 'demo-message-2',
        name: 'Nate Burke',
        email: 'nate@example.com',
        phone: '',
        message:
          'Do you have anything without dairy besides the bread? My daughter has an allergy and really wants to come by.',
        read: false,
        createdAt: hoursAgo(5)
      },
      {
        id: 'demo-message-3',
        name: 'Rosa Delgado',
        email: 'rosa@example.com',
        phone: '(503) 555-0183',
        message:
          'I run the cafe on Alder Street, and we’d love to talk about a weekly wholesale bread order. Who’s the best person to speak with?',
        read: true,
        createdAt: hoursAgo(28)
      },
      {
        id: 'demo-message-4',
        name: 'Sam Whitfield',
        email: 'sam@example.com',
        phone: '',
        message:
          'Just wanted to say the seeded rye got me through a very long week. Please never stop making it.',
        read: true,
        createdAt: hoursAgo(76)
      }
    ]
  };
}

export function demoMenu() {
  return {
    items: sampleMenu.map((item) => ({
      id: item.id,
      category: item.category as MenuCategory,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      dietary: item.dietary,
      art: item.art,
      soldOut: item.soldOut ?? false,
      featured: item.featured ?? false,
      photoUrl: null as string | null
    }))
  };
}

export function demoSettings() {
  return {
    hours: business.hours,
    pickup: business.pickup,
    box: sampleWeekendBox
  };
}
