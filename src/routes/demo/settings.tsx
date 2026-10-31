import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '~/components/dashboard/settings';
import { demoSettings } from '~/lib/demo-data';

export const Route = createFileRoute('/demo/settings')({
  loader: () => demoSettings(),
  component: () => <SettingsView {...Route.useLoaderData()} />
});
