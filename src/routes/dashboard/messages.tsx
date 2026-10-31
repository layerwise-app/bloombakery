import { createFileRoute } from '@tanstack/react-router';
import { MessagesView } from '~/components/dashboard/messages';
import { getMessages } from '~/lib/owner.functions';

export const Route = createFileRoute('/dashboard/messages')({
  loader: () => getMessages(),
  component: () => <MessagesView {...Route.useLoaderData()} />
});
