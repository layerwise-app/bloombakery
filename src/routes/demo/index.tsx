import { createFileRoute, Link } from '@tanstack/react-router';
import { TodayView } from '~/components/dashboard/reservations';
import { demoToday } from '~/lib/demo-data';

export const Route = createFileRoute('/demo/')({
  loader: () => demoToday(),
  component: DemoToday
});

function DemoToday() {
  const data = Route.useLoaderData();
  return (
    <TodayView
      {...data}
      messagesLink={
        <Link to='/demo/messages' className='font-semibold underline underline-offset-4'>
          Read them
        </Link>
      }
    />
  );
}
