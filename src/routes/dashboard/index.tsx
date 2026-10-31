import { createFileRoute, Link } from '@tanstack/react-router';
import { TodayView } from '~/components/dashboard/reservations';
import { getTodayData } from '~/lib/owner.functions';

export const Route = createFileRoute('/dashboard/')({
  loader: () => getTodayData(),
  component: DashboardToday
});

function DashboardToday() {
  const data = Route.useLoaderData();
  return (
    <TodayView
      {...data}
      messagesLink={
        <Link to='/dashboard/messages' className='font-semibold underline underline-offset-4'>
          Read them
        </Link>
      }
    />
  );
}
