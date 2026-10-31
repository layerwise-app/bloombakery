import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';

const menuPhotoKey = /^menu\/[\w-]+\/[\w-]+\.(jpg|png|webp)$/;

// Menu photos are public by design, so they're served from this site with a
// stable address. Each upload gets a new key, so they can be cached for good.
// Only the `menu/` prefix is reachable; nothing else in Storage is exposed.
export const Route = createFileRoute('/media/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? '';
        if (!menuPhotoKey.test(key)) {
          return new Response('Not found', { status: 404 });
        }
        const object = await env.STORAGE.get(key);
        if (!object) return new Response('Not found', { status: 404 });
        return new Response(object.body, {
          headers: {
            'content-type': object.contentType,
            'cache-control': 'public, max-age=31536000, immutable',
            'x-content-type-options': 'nosniff'
          }
        });
      }
    }
  }
});
