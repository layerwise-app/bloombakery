/** `450` to `$4.50`, and `900` to `$9`. */
export function formatPrice(cents: number) {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** `jane@example.com` to `j•••@example.com`, for screens a link could reach. */
export function maskEmail(email: string) {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}•••@${domain}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const statusLabels = {
  new: 'New',
  ready: 'Ready',
  picked_up: 'Picked up',
  canceled: 'Canceled'
} as const;

export function formatStamp(date: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone
  }).format(new Date(date));
}

/** Where `/media/*` serves a menu photo from. */
export function photoUrl(photoKey: string | null) {
  return photoKey ? `/media/${photoKey}` : null;
}
