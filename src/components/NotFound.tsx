import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Art } from '~/components/art';

export function NotFound({ children }: { children?: ReactNode }) {
  return (
    <div className='mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center'>
      <Art name='cookie' className='w-36' />
      <h1 className='display mt-6 text-6xl'>All crumbs here.</h1>
      <div className='mt-4 text-lg'>
        {children ?? (
          <p>We couldn’t find that page. It may have moved, or sold out.</p>
        )}
      </div>
      <div className='mt-7 flex flex-wrap justify-center gap-3'>
        <Link to='/' className='btn btn-primary'>
          Back to the bakery
        </Link>
        <Link to='/menu' className='btn btn-ghost'>
          See the menu
        </Link>
      </div>
    </div>
  );
}
