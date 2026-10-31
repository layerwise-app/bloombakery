import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '~/components/dashboard/settings';
import { getOwnerSettings } from '~/lib/owner.functions';

export const Route = createFileRoute('/dashboard/settings')({
  loader: () => getOwnerSettings(),
  component: () => <SettingsView {...Route.useLoaderData()} />
});
