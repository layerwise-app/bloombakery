import { createFileRoute } from '@tanstack/react-router';
import { ReservationsView } from '~/components/dashboard/reservations';
import { demoAllReservations } from '~/lib/demo-data';

export const Route = createFileRoute('/demo/reservations')({
  loader: () => demoAllReservations(),
  component: () => <ReservationsView {...Route.useLoaderData()} />
});
