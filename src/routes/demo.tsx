import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { business } from '~/business.config';
import { DashboardShell } from '~/components/dashboard/shell';
import { seo } from '~/utils/seo';

// The public demo. Its pages read only from `~/lib/demo-data` and pass no
// session, so they can't reach real reservations or messages. The server
// functions behind the dashboard stay owner-only regardless.
export const Route = createFileRoute('/demo')({
  beforeLoad: () => {
    if (!business.demoDashboard) throw notFound();
  },
  head: () =>
    seo({
      title: `Demo dashboard | ${business.name}`,
      description: 'A read-only tour of the owner dashboard with sample data.',
      noindex: true
    }),
  component: () => (
    <DashboardShell demo>
      <Outlet />
    </DashboardShell>
  )
});
