// The starting menu, quotes, and weekend box. The seed migration in `drizzle/`
// was written from these values, and the demo dashboard displays them. After
// the first publish the database is the source of truth; edit items in the
// dashboard rather than here.

import type { MenuCategory } from '~/db/schema';

export type SampleMenuItem = {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  priceCents: number;
  dietary: string[];
  art: string;
  soldOut?: boolean;
  featured?: boolean;
};

export const sampleMenu: SampleMenuItem[] = [
  {
    id: 'sourdough-loaf',
    category: 'breads',
    name: 'Sourdough loaf',
    description:
      'Our house loaf. A 36-hour rise, a blistered, crackly crust, and a tangy, open crumb.',
    priceCents: 900,
    dietary: ['Vegan'],
    art: 'boule',
    featured: true
  },
  {
    id: 'seeded-rye',
    category: 'breads',
    name: 'Seeded rye',
    description:
      'Dark rye packed with sunflower, flax, and sesame. Keeps beautifully for a week.',
    priceCents: 1100,
    dietary: ['Vegan'],
    art: 'rye'
  },
  {
    id: 'honey-wheat',
    category: 'breads',
    name: 'Honey wheat pan loaf',
    description:
      'Soft, sliceable, and lightly sweet. The one kids ask for in their lunch box.',
    priceCents: 1000,
    dietary: ['Vegetarian'],
    art: 'panloaf',
    soldOut: true
  },
  {
    id: 'demi-baguette',
    category: 'breads',
    name: 'Demi baguette',
    description: 'Thin, shattering crust and a chewy middle. Best within the hour.',
    priceCents: 450,
    dietary: ['Vegan'],
    art: 'baguette'
  },
  {
    id: 'rosemary-focaccia',
    category: 'breads',
    name: 'Rosemary focaccia',
    description:
      'Dimpled and golden, with olive oil, flaky salt, Castelvetrano olives, and rosemary.',
    priceCents: 700,
    dietary: ['Vegan'],
    art: 'focaccia'
  },
  {
    id: 'butter-croissant',
    category: 'pastries',
    name: 'Butter croissant',
    description:
      'Three days of folding and cultured butter. Shatters on the outside, honeycomb within.',
    priceCents: 450,
    dietary: ['Vegetarian'],
    art: 'croissant',
    featured: true
  },
  {
    id: 'cinnamon-roll',
    category: 'pastries',
    name: 'Cinnamon roll',
    description:
      'Sourdough brioche, dark cinnamon sugar, and a tangy cream cheese glaze.',
    priceCents: 500,
    dietary: ['Vegetarian'],
    art: 'cinnamonroll',
    featured: true
  },
  {
    id: 'pain-au-chocolat',
    category: 'pastries',
    name: 'Pain au chocolat',
    description: 'Croissant dough wrapped around two bars of bittersweet chocolate.',
    priceCents: 525,
    dietary: ['Vegetarian'],
    art: 'painauchocolat'
  },
  {
    id: 'almond-morning-bun',
    category: 'pastries',
    name: 'Almond morning bun',
    description:
      'Rolled in orange sugar and toasted almonds. Usually gone by nine, so come early.',
    priceCents: 550,
    dietary: ['Vegetarian', 'Contains nuts'],
    art: 'morningbun',
    soldOut: true
  },
  {
    id: 'plum-danish',
    category: 'pastries',
    name: 'Seasonal plum danish',
    description: 'Roasted plums on vanilla custard in a flaky, golden square.',
    priceCents: 575,
    dietary: ['Vegetarian'],
    art: 'danish'
  },
  {
    id: 'chocolate-cookie',
    category: 'pastries',
    name: 'Flourless chocolate cookie',
    description: 'Crackled and fudgy, with a pinch of sea salt. No flour in the recipe.',
    priceCents: 375,
    dietary: ['Vegetarian', 'Gluten-free'],
    art: 'cookie'
  },
  {
    id: 'drip-coffee',
    category: 'coffee',
    name: 'Drip coffee',
    description: 'A rotating single origin, roasted a few miles from here.',
    priceCents: 350,
    dietary: ['Vegan'],
    art: 'drip',
    featured: true
  },
  {
    id: 'cortado',
    category: 'coffee',
    name: 'Cortado',
    description: 'Equal parts espresso and steamed milk, served in a small glass.',
    priceCents: 425,
    dietary: ['Vegetarian'],
    art: 'cortado'
  },
  {
    id: 'oat-latte',
    category: 'coffee',
    name: 'Oat milk latte',
    description: 'Double espresso and silky oat milk. Our most-ordered drink.',
    priceCents: 550,
    dietary: ['Vegan', 'Dairy-free'],
    art: 'latte'
  },
  {
    id: 'cold-brew',
    category: 'coffee',
    name: 'Cold brew',
    description: 'Steeped for 18 hours, smooth and chocolatey, poured over ice.',
    priceCents: 475,
    dietary: ['Vegan'],
    art: 'coldbrew'
  },
  {
    id: 'masala-chai',
    category: 'coffee',
    name: 'Masala chai',
    description: 'Black tea simmered with ginger, cardamom, and a little honey.',
    priceCents: 500,
    dietary: ['Vegetarian'],
    art: 'chai'
  }
];

export const sampleQuotes = [
  {
    id: 'quote-1',
    quote:
      'I moved four blocks closer to this bakery, and I am only slightly embarrassed to admit it.',
    author: 'Maya R.',
    detail: 'Saturday regular'
  },
  {
    id: 'quote-2',
    quote:
      'That sourdough ruined grocery store bread for my entire family. We reserve a box every single weekend now.',
    author: 'Daniel & Priya',
    detail: 'Weekend box regulars'
  },
  {
    id: 'quote-3',
    quote:
      'They remembered my order on the second visit. The croissant is reason enough to come, but that is why I stay.',
    author: 'Tom H.',
    detail: 'Neighbor since 2019'
  }
];

export type WeekendBox = {
  title: string;
  priceCents: number;
  blurb: string;
  items: string[];
};

export const sampleWeekendBox: WeekendBox = {
  title: 'The weekend box',
  priceCents: 3200,
  blurb:
    'Everything for a slow Saturday or Sunday morning, packed up and waiting for you. Reserve ahead, skip the line, and pay when you pick it up.',
  items: [
    'One sourdough loaf',
    'Two butter croissants',
    'Two cinnamon rolls',
    'A jar of cultured butter',
    'A jar of seasonal jam',
    'Half a pound of house coffee'
  ]
};
