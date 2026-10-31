import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PhoneIcon, SearchIcon } from 'lucide-react';
import { EmptyState, PageHeading, useDashboard, useDashboardMutation } from '~/components/dashboard/shell';
import { reservationStatuses } from '~/db/schema';
import type { ReservationStatus } from '~/db/schema';
import { formatPrice, statusLabels } from '~/lib/format';
import { setReservationStatus } from '~/lib/owner.functions';
import { formatDate, formatTime } from '~/lib/schedule';

export type ReservationRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
  unitPriceCents: number;
  status: ReservationStatus;
};

const statusStyles: Record<ReservationStatus, string> = {
  new: 'bg-butter text-ink',
  ready: 'bg-crust text-[#fffaf0]',
  picked_up: 'bg-sage text-[#fffaf0]',
  canceled: 'bg-paper-deep text-ink line-through'
};

export function StatusSelect({ reservation }: { reservation: ReservationRow }) {
  const { readOnly } = useDashboard();
  const update = useDashboardMutation((status: ReservationStatus) =>
    setReservationStatus({ data: { id: reservation.id, status } })
  );
  const value = update.isPending && update.variables ? update.variables : reservation.status;
  return (
    <select
      aria-label={`Status for ${reservation.name}`}
      className={`h-10 w-full cursor-pointer appearance-none border-[1.5px] border-ink bg-[length:0.75rem] bg-[right_0.6rem_center] bg-no-repeat px-2.5 pr-7 font-semibold disabled:cursor-not-allowed ${statusStyles[value]}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E\")"
      }}
      value={value}
      disabled={readOnly || update.isPending}
      onChange={(event) => update.mutate(event.target.value as ReservationStatus)}
    >
      {reservationStatuses.map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}

export function TodayView({
  today,
  pickups,
  unreadMessages,
  messagesLink
}: {
  today: string;
  pickups: ReservationRow[];
  unreadMessages: number;
  messagesLink: ReactNode;
}) {
  const active = pickups.filter((pickup) => pickup.status !== 'canceled');
  const sum = (rows: ReservationRow[]) => rows.reduce((total, row) => total + row.quantity, 0);
  const stats = [
    { label: 'Boxes today', value: sum(active) },
    { label: 'To pack', value: sum(active.filter((pickup) => pickup.status === 'new')) },
    { label: 'Ready', value: sum(active.filter((pickup) => pickup.status === 'ready')) },
    { label: 'Picked up', value: sum(active.filter((pickup) => pickup.status === 'picked_up')) }
  ];

  const times = [...new Set(pickups.map((pickup) => pickup.pickupTime))].sort();

  return (
    <>
      <PageHeading eyebrow='Today’s pickups' title={formatDate(today)} />

      <dl className='mb-8 grid grid-cols-2 border-2 border-ink sm:grid-cols-4'>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`p-4 ${index % 2 ? 'border-l-2 border-ink' : ''} ${index >= 2 ? 'border-t-2 border-ink sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-2' : ''}`}
          >
            <dt className='label text-crust'>{stat.label}</dt>
            <dd className='display mt-1 text-5xl'>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {unreadMessages > 0 ? (
        <p className='mb-8 border-l-4 border-crust pl-3 text-lg'>
          You have {unreadMessages} unread {unreadMessages === 1 ? 'message' : 'messages'}. {messagesLink}
        </p>
      ) : null}

      {times.length === 0 ? (
        <EmptyState title='No pickups today'>
          Reservations for today will show up here, grouped by pickup time.
        </EmptyState>
      ) : (
        <div className='space-y-8'>
          {times.map((time) => {
            const rows = pickups.filter((pickup) => pickup.pickupTime === time);
            const boxes = sum(rows.filter((row) => row.status !== 'canceled'));
            return (
              <section key={time} aria-label={`Pickups at ${formatTime(time)}`}>
                <div className='mb-2 flex items-baseline justify-between gap-3'>
                  <h2 className='text-3xl font-medium'>{formatTime(time)}</h2>
                  <span className='label'>
                    {boxes} {boxes === 1 ? 'box' : 'boxes'}
                  </span>
                </div>
                <ul className='border-t-2 border-ink'>
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className={`grid grid-cols-[1fr_8.25rem] items-center gap-x-4 gap-y-1 border-b border-ink/30 py-3 sm:grid-cols-[1fr_auto_auto_9rem] ${row.status === 'canceled' ? 'opacity-60' : ''}`}
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-lg font-semibold'>{row.name}</p>
                        <p className='font-mono text-sm opacity-80'>
                          {row.quantity} × box · {row.code}
                        </p>
                      </div>
                      <a
                        href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                        className='col-start-1 row-start-2 flex items-center gap-1.5 text-sm underline underline-offset-4 sm:col-start-auto sm:row-start-auto'
                      >
                        <PhoneIcon className='size-3.5' aria-hidden='true' />
                        {row.phone}
                      </a>
                      <span className='hidden font-mono sm:inline'>
                        {formatPrice(row.quantity * row.unitPriceCents)}
                      </span>
                      <div className='col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto'>
                        <StatusSelect reservation={row} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export function ReservationsView({ reservations }: { reservations: ReservationRow[] }) {
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const totals = { all: reservations.length, new: 0, ready: 0, picked_up: 0, canceled: 0 };
    for (const reservation of reservations) totals[reservation.status] += 1;
    return totals;
  }, [reservations]);

  const search = query.trim().toLowerCase();
  const visible = reservations.filter(
    (reservation) =>
      (filter === 'all' || reservation.status === filter) &&
      (!search ||
        [reservation.name, reservation.email, reservation.code, reservation.phone].some((value) =>
          value.toLowerCase().includes(search)
        ))
  );

  return (
    <>
      <PageHeading eyebrow='Weekend box' title='Reservations' />
      <div className='mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div role='group' aria-label='Filter by status' className='no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0'>
          {(['all', ...reservationStatuses] as const).map((status) => (
            <button
              key={status}
              type='button'
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
              className={`shrink-0 border-[1.5px] border-ink px-3 py-1.5 font-medium whitespace-nowrap ${filter === status ? 'bg-ink text-paper' : ''}`}
            >
              {status === 'all' ? 'All' : statusLabels[status]}{' '}
              <span className='font-mono text-sm opacity-80'>{counts[status]}</span>
            </button>
          ))}
        </div>
        <label className='relative block lg:w-72'>
          <span className='sr-only'>Search reservations</span>
          <SearchIcon className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60' aria-hidden='true' />
          <input
            type='search'
            placeholder='Name, email, or reference'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='field-input !min-h-10 !py-1.5 pl-9'
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={reservations.length ? 'No matches' : 'No reservations yet'}>
          {reservations.length
            ? 'Try a different status or search.'
            : 'When someone reserves a weekend box, it will appear here.'}
        </EmptyState>
      ) : (
        <ul className='border-t-2 border-ink'>
          <li className='label hidden grid-cols-[11rem_1fr_6rem_6rem_9.5rem] gap-4 border-b-2 border-ink py-2 md:grid' aria-hidden='true'>
            <span>Pickup</span>
            <span>Customer</span>
            <span>Boxes</span>
            <span>Reference</span>
            <span>Status</span>
          </li>
          {visible.map((reservation) => (
            <li
              key={reservation.id}
              className='grid grid-cols-[1fr_8.25rem] items-center gap-x-4 gap-y-1 border-b border-ink/30 py-3 md:grid-cols-[11rem_1fr_6rem_6rem_9.5rem]'
            >
              <div className='col-span-2 flex items-baseline gap-2 md:col-span-1 md:block'>
                <p className='font-semibold'>{formatDate(reservation.pickupDate, 'medium')}</p>
                <p className='font-mono text-sm opacity-80'>{formatTime(reservation.pickupTime)}</p>
              </div>
              <div className='min-w-0'>
                <p className='truncate text-lg font-medium'>{reservation.name}</p>
                <p className='text-sm opacity-80'>
                  <a href={`mailto:${reservation.email}`} className='block truncate underline-offset-2 hover:underline lg:inline'>
                    {reservation.email}
                  </a>
                  <span className='hidden lg:inline'> · </span>
                  <a href={`tel:${reservation.phone.replace(/[^\d+]/g, '')}`} className='block underline-offset-2 hover:underline lg:inline'>
                    {reservation.phone}
                  </a>
                </p>
                <p className='font-mono text-sm opacity-80 md:hidden'>
                  {reservation.quantity} × box · {reservation.code}
                </p>
              </div>
              <span className='hidden font-mono md:inline'>{reservation.quantity}</span>
              <span className='hidden font-mono text-sm md:inline'>{reservation.code}</span>
              <StatusSelect reservation={reservation} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
