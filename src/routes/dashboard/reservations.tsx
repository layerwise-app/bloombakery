import { createFileRoute } from '@tanstack/react-router';
import { ReservationsView } from '~/components/dashboard/reservations';
import { getAllReservations } from '~/lib/owner.functions';

export const Route = createFileRoute('/dashboard/reservations')({
  loader: () => getAllReservations(),
  component: () => <ReservationsView {...Route.useLoaderData()} />
});
