import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { business } from '~/business.config';
import { BloomMark } from '~/components/art';

/** The branded page around sign-in and password forms. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-4 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-2 [&_[data-slot=card]]:border-ink [&_[data-slot=card]]:shadow-[5px_6px_0_var(--ink)] [&_[data-slot=card]]:ring-0 [&_[data-slot=card-title]]:text-3xl [&_[data-slot=card-title]]:font-medium'>
      <Link to='/' className='flex items-center gap-2.5'>
        <BloomMark className='size-9 text-crust' />
        <span className='display text-3xl'>{business.name}</span>
      </Link>
      {children}
      <p className='max-w-sm text-center leading-snug'>
        This sign-in is for the bakery’s owners.
        {business.demoDashboard ? (
          <>
            {' '}
            Just looking around?{' '}
            <Link to='/demo' className='font-semibold underline underline-offset-4'>
              View demo dashboard
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
