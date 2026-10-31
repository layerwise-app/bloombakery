import { Link, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  console.error(error);

  return (
    <div className='mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center'>
      <h1 className='display text-6xl'>Something burned.</h1>
      <p className='mt-4 text-lg'>
        That page didn’t load the way it should have. Please try again.
      </p>
      <div className='mt-7 flex flex-wrap justify-center gap-3'>
        <button
          type='button'
          className='btn btn-primary'
          onClick={() => router.invalidate()}
        >
          Try again
        </button>
        <Link to='/' className='btn btn-ghost'>
          Back to the bakery
        </Link>
      </div>
    </div>
  );
}
