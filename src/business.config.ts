/**
 * Make this site yours: everything about the business lives in this one file.
 * Change a value, save, and the pages, emails, share tags, structured data,
 * and colors all follow.
 *
 * Menu items, customer quotes, and the weekend box are stored in the database
 * so they can be edited in the owner dashboard. Hours, pickup times, and slot
 * capacity start from the values here; once an owner saves them in the
 * dashboard, the saved values win.
 */

export type DayHours = { open: string; close: string } | null;

export const business = {
  name: 'Bloom Bakery',
  /** Shown on the home page hero. */
  headline: 'Fresh bread, baked at dawn.',
  tagline: 'Sourdough and pastries, baked every morning.',
  /** One or two sentences for search results and link previews. */
  description:
    'A neighborhood sourdough bakery with bread, pastries, and coffee baked every morning. Reserve a weekend box for pickup and pay in store.',
  established: 2017,
  neighborhood: 'Larkspur Hill',

  /** These details are fictional. Replace them with your own. */
  contact: {
    phone: '(503) 555-0142',
    email: 'hello@bloombakery.example',
    street: '214 Larkspur Lane',
    city: 'Fernhollow',
    region: 'OR',
    postalCode: '97000',
    country: 'US',
    /** Short directions shown on the Visit page. */
    mapLabels: { main: 'Larkspur Lane', cross: '3rd Street', park: 'Hollow Park' },
    directions:
      'On the corner of Larkspur and 3rd, across from Hollow Park. Free street parking on 3rd, and the No. 12 bus stops right outside.'
  },

  /** IANA time zone. "Today", opening status, and pickups all use it. */
  timeZone: 'America/Los_Angeles',

  /** Keys: 0 is Sunday, 6 is Saturday. `null` means closed that day. */
  hours: {
    0: { open: '08:00', close: '13:00' },
    1: null,
    2: { open: '07:00', close: '14:00' },
    3: { open: '07:00', close: '14:00' },
    4: { open: '07:00', close: '14:00' },
    5: { open: '07:00', close: '15:00' },
    6: { open: '07:30', close: '15:00' }
  } as Record<number, DayHours>,

  /** Every color on the site, including the illustrations, comes from here. */
  colors: {
    /** Page background. */
    paper: '#f6ecda',
    /** Slightly deeper paper for bands and panels. */
    paperDeep: '#ecdcc0',
    /** Main text. */
    ink: '#2a1810',
    /** The main accent: buttons, links, and bread crust. */
    crust: '#a4451d',
    /** Bright highlight: butter, sunrise, and golden pastry. */
    butter: '#efb551',
    /** Dark brown for bands, chocolate, and coffee. */
    rye: '#4b2a1a',
    /** A soft green for herbs and dietary labels. */
    sage: '#5f6f45'
  },

  /** Use full URLs. Remove a line to hide that link. */
  social: [
    {
      label: 'Instagram',
      handle: '@bloombakery.example',
      url: 'https://www.instagram.com/bloombakery.example/'
    },
    {
      label: 'Facebook',
      handle: 'Bloom Bakery',
      url: 'https://www.facebook.com/bloombakery.example/'
    }
  ],

  /**
   * Who can open the owner dashboard. An account needs a verified email on
   * this list, and only these addresses can sign in or receive a sign-in code.
   * Replace this with your own address, then sign in with an emailed code.
   */
  owners: ['owner@bloombakery.example'],

  /** Contact form messages are emailed here. Use a real inbox. */
  notifyEmail: 'owner@bloombakery.example',

  /** How weekend box reservations work. */
  pickup: {
    /** Days the box can be collected (0 is Sunday, 6 is Saturday). */
    days: [6, 0],
    /** Pickup times, which also need to fall within that day's opening hours. */
    times: ['08:00', '09:00', '10:00', '11:00', '12:00'],
    /** Boxes the bakery can hand over per time slot. */
    capacityPerSlot: 6,
    /** The most boxes one reservation can include. */
    maxPerReservation: 4,
    /** How many days ahead pickups can be reserved. */
    daysAhead: 21,
    /** Reservations close this long before a pickup time. */
    cutoffHours: 2
  },

  /** Shown on the home page. */
  story: {
    title: 'A neighborhood oven, and not much else.',
    paragraphs: [
      'Bloom started with one jar of starter and a secondhand deck oven in a former bike shop on Larkspur Lane. We mixed the first batch for neighbors who kept asking when the smell of bread would turn into an actual bakery.',
      'The recipe has barely changed since. Local flour, water, salt, and a long, slow rise overnight. We shape everything by hand, bake until the crust crackles, and stop when we sell out.'
    ],
    pullQuote: 'Bread takes as long as it takes. We just get up early enough to let it.',
    morning: [
      { time: '3:30 AM', text: 'Ovens on. First shaped loaves come out of the cooler.' },
      { time: '5:45 AM', text: 'Sourdough out, croissants in. The whole block knows.' },
      { time: '7:00 AM', text: 'Doors open, coffee on, and the rack is full.' }
    ]
  },

  /** Turns on the public, read-only "View demo dashboard" link and pages. */
  demoDashboard: true,

  /**
   * Limits for the public forms: tries per visitor per hour, and confirmation
   * emails per address per day. All email stops for the day at `emailsPerDay`,
   * though reservations and messages are still saved.
   */
  limits: {
    reservationsPerHour: 8,
    reservationsPerEmailPerDay: 4,
    messagesPerHour: 4,
    emailsPerDay: 150
  }
};

export type Business = typeof business;

export function fullAddress() {
  const { street, city, region, postalCode } = business.contact;
  return `${street}, ${city}, ${region} ${postalCode}`;
}

/** The phone number as a `tel:` link. */
export function phoneHref() {
  return `tel:+1${business.contact.phone.replace(/\D/g, '')}`;
}
