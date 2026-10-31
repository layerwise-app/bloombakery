import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { business } from '~/business.config';
import { AuthFrame } from '~/components/auth-frame';
import { signOut } from '~/lib/auth-client';
import { getOwnerGate } from '~/lib/owner.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/no-access')({
  beforeLoad: async () => {
    const gate = await getOwnerGate();
    if (gate.state === 'signed-out') throw redirect({ to: '/sign-in' });
    if (gate.state === 'owner') throw redirect({ to: '/dashboard' });
    return gate;
  },
  head: () => seo({ title: `No access | ${business.name}`, noindex: true }),
  component: NoAccessPage
});

function NoAccessPage() {
  const { email, needsVerification } = Route.useRouteContext();
  const navigate = useNavigate();
  return (
    <AuthFrame>
      <div className='w-full max-w-sm border-2 border-ink bg-card p-6 shadow-[5px_6px_0_var(--ink)]'>
        <h1 className='text-3xl font-medium'>
          {needsVerification ? 'Confirm your email' : 'This one’s for owners'}
        </h1>
        <p className='mt-3 leading-snug'>
          {needsVerification ? (
            <>
              Please sign out, then sign back in with an emailed code to confirm you own{' '}
              <strong className='break-all'>{email}</strong>.
            </>
          ) : (
            <>
              <strong className='break-all'>{email}</strong> isn’t on this bakery’s owner list, so
              the dashboard is closed to it.
            </>
          )}
        </p>
        <div className='mt-5 flex flex-col gap-3'>
          <button
            type='button'
            className='btn btn-ink'
            onClick={async () => {
              await signOut();
              await navigate({ to: '/sign-in' });
            }}
          >
            Sign out
          </button>
          <Link to='/' className='btn btn-ghost'>
            Back to the bakery
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
