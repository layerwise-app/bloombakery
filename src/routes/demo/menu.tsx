import { createFileRoute } from '@tanstack/react-router';
import { MenuEditorView } from '~/components/dashboard/menu-editor';
import { demoMenu } from '~/lib/demo-data';

export const Route = createFileRoute('/demo/menu')({
  loader: () => demoMenu(),
  component: () => <MenuEditorView {...Route.useLoaderData()} />
});
