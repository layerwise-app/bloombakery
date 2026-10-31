import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  MobileActionBar,
  SiteFooter,
  SiteHeader
} from '~/components/site/chrome';
import { getSiteInfo } from '~/lib/public.functions';

export const Route = createFileRoute('/_site')({
  loader: () => getSiteInfo(),
  component: SiteLayout
});

function SiteLayout() {
  const info = Route.useLoaderData();
  return (
    <div className='flex min-h-svh flex-col'>
      <a
        href='#main'
        className='sr-only z-50 bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2'
      >
        Skip to content
      </a>
      <SiteHeader info={info} />
      <main id='main' className='flex-1'>
        <Outlet />
      </main>
      <SiteFooter info={info} />
      <MobileActionBar />
    </div>
  );
}
