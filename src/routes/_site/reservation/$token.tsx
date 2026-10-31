import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  createFileRoute,
  Link,
  notFound,
  useRouter
} from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { business, fullAddress, phoneHref } from '~/business.config';
import { BloomMark } from '~/components/art';
import { FormAlert } from '~/components/site/form';
import { formatPrice } from '~/lib/format';
import { cancelReservation, getReservation } from '~/lib/public.functions';
import { formatDate, formatTime } from '~/lib/schedule';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/_site/reservation/$token')({
  loader: async ({ params }) => {
    const reservation = await getReservation({ data: { token: params.token } });
    if (!reservation) throw notFound();
    return reservation;
  },
  head: () => {
    const tags = seo({ title: `Your reservation | ${business.name}`, noindex: true });
    // Keep the private link out of the Referer header on outgoing clicks.
    return { ...tags, meta: [...tags.meta, { name: 'referrer', content: 'no-referrer' }] };
  },
  component: ReservationPage
});

const headlines = {
  new: (name: string) => `You’re on the list, ${name}.`,
  ready: (name: string) => `It’s ready, ${name}.`,
  picked_up: (name: string) => `Enjoy it, ${name}.`,
  canceled: () => 'This reservation is canceled.'
};

const statusNotes = {
  new: 'Reserved. We’ll have it packed and waiting.',
  ready: 'Packed and waiting at the counter.',
  picked_up: 'Picked up. Thanks for coming by.',
  canceled: 'Canceled. Nothing is due.'
};

/** A tear line with a punched notch at each edge of the ticket. */
function TicketDivider() {
  const notch =
    'absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-ink bg-paper';
  return (
    <div className='relative -mx-5 sm:-mx-8' aria-hidden='true'>
      <div className='mx-5 border-t-2 border-dashed border-ink/40' />
      <span className={`${notch} -left-[0.7rem] [clip-path:inset(-2px_-2px_-2px_50%)]`} />
      <span className={`${notch} -right-[0.7rem] [clip-path:inset(-2px_50%_-2px_-2px)]`} />
    </div>
  );
}

function ReservationPage() {
  const reservation = Route.useLoaderData();
  const { token } = Route.useParams();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const cancel = useMutation({
    mutationFn: () => cancelReservation({ data: { token } }),
    onSuccess: async () => {
      setConfirming(false);
      await router.invalidate();
    }
  });

  const canceled = reservation.status === 'canceled';
  const total = reservation.quantity * reservation.unitPriceCents;

  return (
    <div
      className='mx-auto max-w-3xl px-5 py-10 sm:px-8 md:py-16'
      style={{ '--ticket': 'color-mix(in oklab, var(--paper) 40%, white)' } as CSSProperties}
    >
      <h1 className='display reveal-rise text-[clamp(3.2rem,9vw,5.75rem)]'>
        {headlines[reservation.status](reservation.firstName)}
      </h1>

      <section
        aria-label='Reservation details'
        className={`reveal-rise mt-8 border-2 border-ink bg-[var(--ticket)] shadow-[5px_6px_0_var(--ink)] ${canceled ? 'opacity-70' : ''}`}
      >
        <div className='px-5 py-6 sm:px-8'>
          <div className='flex items-center justify-between gap-4 pb-4'>
            <span className='flex items-center gap-2'>
              <BloomMark className='size-7 text-crust' />
              <span className='display text-2xl whitespace-nowrap'>{business.name}</span>
            </span>
            <span className='label text-right max-[400px]:hidden'>Pickup ticket</span>
          </div>
          <TicketDivider />
          <div className='py-5'>
            <p className='label text-crust'>Pickup</p>
            <p className={`display mt-1 text-[2.6rem] [text-wrap:balance] sm:text-6xl ${canceled ? 'line-through' : ''}`}>
              {formatDate(reservation.pickupDate)}
            </p>
            <p className='mt-2 font-mono text-2xl'>at {formatTime(reservation.pickupTime)}</p>
          </div>
          <TicketDivider />
          <dl className='grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3'>
            <div>
              <dt className='label text-crust'>Boxes</dt>
              <dd className='mt-1 font-mono text-xl'>{reservation.quantity}</dd>
            </div>
            <div>
              <dt className='label text-crust'>{canceled ? 'Was due' : 'Due in store'}</dt>
              <dd className='mt-1 font-mono text-xl'>{formatPrice(total)}</dd>
            </div>
            <div className='col-span-2 sm:col-span-1'>
              <dt className='label text-crust'>Reference</dt>
              <dd className='mt-1 font-mono text-xl' data-testid='reservation-code'>
                {reservation.code}
              </dd>
            </div>
          </dl>
          <div className='mt-5'>
            <TicketDivider />
          </div>
          <p className='pt-4 font-semibold'>{statusNotes[reservation.status]}</p>
        </div>
      </section>

      <div className='reveal-rise mt-9 space-y-6 text-lg leading-relaxed'>
        <p>
          {reservation.emailStatus === 'sent' ? (
            <>
              We emailed your confirmation to <strong>{reservation.maskedEmail}</strong>.{' '}
            </>
          ) : (
            <>
              We couldn’t email your confirmation this time, so please save this page.{' '}
            </>
          )}
          This link is private to you. Keep it handy, and don’t share it.
        </p>

        <div className='flex flex-wrap gap-3'>
          <button
            type='button'
            className='btn btn-ghost max-sm:w-full'
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            }}
          >
            {copied ? <CheckIcon className='size-4' aria-hidden='true' /> : <CopyIcon className='size-4' aria-hidden='true' />}
            {copied ? 'Link copied' : 'Copy private link'}
          </button>
          <Link to='/menu' className='btn btn-ghost max-sm:w-full'>
            See the menu
          </Link>
        </div>

        <div className='border-t-2 border-ink pt-6'>
          <h2 className='text-3xl font-medium'>Where to find us</h2>
          <p className='mt-2'>
            {fullAddress()}
            <br />
            {business.contact.directions}
          </p>
          <p className='mt-2'>
            Running late? Call{' '}
            <a href={phoneHref()} className='font-semibold underline underline-offset-4'>
              {business.contact.phone}
            </a>
            .
          </p>
        </div>

        {reservation.canCancel ? (
          <div className='border-t-2 border-ink pt-6'>
            <h2 className='text-3xl font-medium'>Change of plans?</h2>
            {cancel.data && !cancel.data.ok ? (
              <div className='mt-3'>
                <FormAlert>This reservation can’t be canceled online anymore. Please call us.</FormAlert>
              </div>
            ) : null}
            {confirming ? (
              <div className='mt-3'>
                <p className='font-medium'>
                  Cancel this reservation? Your {reservation.quantity === 1 ? 'box goes' : 'boxes go'} back up for
                  someone else to reserve.
                </p>
                <div className='mt-3 flex flex-wrap gap-3'>
                  <button
                    type='button'
                    className='btn btn-ink max-sm:w-full'
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate()}
                  >
                    {cancel.isPending ? 'Canceling…' : 'Yes, cancel it'}
                  </button>
                  <button
                    type='button'
                    className='btn btn-ghost max-sm:w-full'
                    onClick={() => setConfirming(false)}
                  >
                    Keep my reservation
                  </button>
                </div>
              </div>
            ) : (
              <button
                type='button'
                className='mt-2 font-semibold underline underline-offset-4'
                onClick={() => setConfirming(true)}
              >
                Cancel this reservation
              </button>
            )}
          </div>
        ) : null}

        {canceled ? (
          <Link to='/weekend-box' className='btn btn-primary max-sm:w-full'>
            Reserve another box
          </Link>
        ) : null}
      </div>
    </div>
  );
}
