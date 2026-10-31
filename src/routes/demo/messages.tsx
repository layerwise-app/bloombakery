import { createFileRoute } from '@tanstack/react-router';
import { MessagesView } from '~/components/dashboard/messages';
import { demoMessages } from '~/lib/demo-data';

export const Route = createFileRoute('/demo/messages')({
  loader: () => demoMessages(),
  component: () => <MessagesView {...Route.useLoaderData()} />
});
