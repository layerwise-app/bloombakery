import { createFileRoute } from '@tanstack/react-router';
import { MenuEditorView } from '~/components/dashboard/menu-editor';
import { getOwnerMenu } from '~/lib/owner.functions';

export const Route = createFileRoute('/dashboard/menu')({
  loader: () => getOwnerMenu(),
  component: () => <MenuEditorView {...Route.useLoaderData()} />
});
