import { business } from '~/business.config';
import { site, siteUrl } from '~/lib/site';
import { dayName } from '~/lib/schedule';
import type { WeeklyHours } from '~/lib/schedule';

/** schema.org Bakery data, built from the config and the current hours. */
export function bakeryJsonLd(hours: WeeklyHours) {
  const { contact } = business;
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: business.name,
    description: business.description,
    slogan: business.tagline,
    url: siteUrl('/'),
    image: siteUrl(site.image),
    logo: siteUrl('/android-chrome-512x512.png'),
    telephone: contact.phone,
    email: contact.email,
    priceRange: '$$',
    servesCuisine: 'Bakery',
    hasMenu: siteUrl('/menu'),
    acceptsReservations: true,
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.street,
      addressLocality: contact.city,
      addressRegion: contact.region,
      postalCode: contact.postalCode,
      addressCountry: contact.country
    },
    hasMap: siteUrl('/visit'),
    areaServed: business.neighborhood,
    sameAs: business.social.map((link) => link.url),
    openingHoursSpecification: Object.entries(hours).flatMap(([weekday, day]) =>
      day
        ? [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: dayName(Number(weekday)),
              opens: day.open,
              closes: day.close
            }
          ]
        : []
    )
  };
}
