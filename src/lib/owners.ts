import { business } from '~/business.config';

const normalize = (email: string) => email.trim().toLowerCase();

export function isOwnerEmail(email: string, owners = business.owners) {
  return owners.map(normalize).includes(normalize(email));
}

/**
 * An owner needs a listed address and proof they control it. Without the
 * verified check, anyone could claim access by registering a listed address.
 */
export function isOwner(
  user: { email: string; emailVerified: boolean },
  owners = business.owners
) {
  return user.emailVerified && isOwnerEmail(user.email, owners);
}
