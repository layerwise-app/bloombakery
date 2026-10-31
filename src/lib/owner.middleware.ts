import { createMiddleware } from '@tanstack/react-start';
import {
  getRequestHeader,
  getRequestHeaders,
  getRequestUrl
} from '@tanstack/react-start/server';
import { auth } from '~/lib/auth';
import { isOwner } from '~/lib/owners';

/**
 * Guards every dashboard server function. Each one is a public endpoint, so a
 * page guard alone would protect nothing.
 */
export const ownerMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    // The auth cookie is `SameSite=None` for the embedded preview, so writes
    // must prove they came from this site.
    const origin = getRequestHeader('origin');
    if (origin && origin !== getRequestUrl().origin) {
      throw new Error('Forbidden');
    }

    const session = await auth.api.getSession({
      headers: getRequestHeaders()
    });
    if (!session || !isOwner(session.user)) throw new Error('Unauthorized');
    return next({ context: { user: session.user } });
  }
);
