import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { business } from '~/business.config';
import { BloomMark } from '~/components/art';
import { signOut } from '~/lib/auth-client';

const DashboardContext = createContext({ readOnly: false });

export function useDashboard() {
  return useContext(DashboardContext);
}

/**
 * A write from a dashboard page. It refreshes the page's data when it finishes,
 * and refuses to run in the read-only demo.
 */
export function useDashboardMutation<TInput>(
  mutate: (input: TInput) => Promise<unknown>,
  { success }: { success?: string } = {}
) {
  const router = useRouter();
  const { readOnly } = useDashboard();
  return useMutation({
    mutationFn: async (input: TInput) => {
      if (readOnly) throw new Error('This demo is read-only.');
      await mutate(input);
    },
    onSuccess: async () => {
      await router.invalidate();
      if (success) toast.success(success);
    },
    onError: (error) => {
      toast.error(error.message || 'That didn’t save. Please try again.');
    }
  });
}

const ownerNav = [
  { to: '/dashboard', label: 'Today', exact: true },
  { to: '/dashboard/reservations', label: 'Reservations' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/menu', label: 'Menu' },
  { to: '/dashboard/settings', label: 'Settings' }
] as const;

const demoNav = [
  { to: '/demo', label: 'Today', exact: true },
  { to: '/demo/reservations', label: 'Reservations' },
  { to: '/demo/messages', label: 'Messages' },
  { to: '/demo/menu', label: 'Menu' },
  { to: '/demo/settings', label: 'Settings' }
] as const;

export function DashboardShell({
  demo = false,
  email,
  children
}: {
  demo?: boolean;
  email?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const nav = demo ? demoNav : ownerNav;
  return (
    <DashboardContext.Provider value={{ readOnly: demo }}>
      <div className='min-h-svh'>
        {demo ? (
          <div className='border-b-2 border-ink bg-butter py-2.5'>
            <p className='mx-auto max-w-7xl px-5 leading-snug font-medium sm:px-8'>
              <strong>Demo dashboard.</strong> Everything here is made-up sample data, and it’s
              read-only. No real customer information is shown.
            </p>
          </div>
        ) : null}
        <header className='bg-ink text-paper'>
          <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8'>
            <Link to='/' className='flex min-w-0 items-center gap-2.5'>
              <BloomMark className='size-7 shrink-0 text-butter' />
              <span className='display truncate text-xl'>{business.name}</span>
            </Link>
            <div className='flex shrink-0 items-center gap-4 text-sm'>
              {demo ? (
                <>
                  <Link to='/' className='underline-offset-4 hover:underline'>
                    Back to site
                  </Link>
                  <Link to='/sign-in' className='font-semibold underline underline-offset-4'>
                    Owner sign-in
                  </Link>
                </>
              ) : (
                <>
                  <span className='hidden opacity-80 sm:inline'>{email}</span>
                  <button
                    type='button'
                    className='flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline'
                    onClick={async () => {
                      await signOut();
                      await navigate({ to: '/sign-in' });
                    }}
                  >
                    <LogOutIcon className='size-4' aria-hidden='true' />
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
          <nav aria-label='Dashboard' className='border-t border-paper/20'>
            <ul className='no-scrollbar mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-3 sm:gap-1 sm:px-6'>
              {nav.map((item) => (
                <li key={item.to} className='shrink-0'>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: 'exact' in item }}
                    className='block border-b-[3px] border-transparent px-1.5 py-2.5 text-[0.94rem] font-medium whitespace-nowrap opacity-85 min-[375px]:px-2 sm:px-2.5 sm:text-base'
                    activeProps={{ className: '!border-butter !opacity-100 text-butter' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className='mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10'>{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className='mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4'>
      <div>
        <p className='label mb-2 text-crust'>{eyebrow}</p>
        <h1 className='display text-[2.75rem] sm:text-6xl'>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='border-2 border-dashed border-ink/40 px-5 py-12 text-center'>
      <h2 className='text-3xl font-medium'>{title}</h2>
      <p className='mx-auto mt-2 max-w-md text-lg opacity-85'>{children}</p>
    </div>
  );
}
