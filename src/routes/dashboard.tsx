import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { DashboardShell } from '~/components/dashboard/shell';
import { getOwnerGate } from '~/lib/owner.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const gate = await getOwnerGate();
    if (gate.state === 'signed-out') throw redirect({ to: '/sign-in' });
    if (gate.state === 'denied') throw redirect({ to: '/no-access' });
    return { email: gate.email };
  },
  head: () => seo({ title: 'Owner dashboard', noindex: true }),
  component: DashboardLayout
});

function DashboardLayout() {
  const { email } = Route.useRouteContext();
  return (
    <DashboardShell email={email}>
      <Outlet />
    </DashboardShell>
  );
}
