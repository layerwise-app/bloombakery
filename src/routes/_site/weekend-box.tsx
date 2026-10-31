import { useEffect, useId, useRef, useState } from 'react';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { business, fullAddress } from '~/business.config';
import { Art } from '~/components/art';
import { Field, FormAlert, Honeypot } from '~/components/site/form';
import { formatPrice } from '~/lib/format';
import { getWeekendBoxPage, submitReservation } from '~/lib/public.functions';
import { formatDate, formatTime } from '~/lib/schedule';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/_site/weekend-box')({
  loader: () => getWeekendBoxPage(),
  head: () =>
    seo({
      title: `Reserve the weekend box | ${business.name}`,
      description:
        'Reserve a box of sourdough, pastries, butter, jam, and coffee. Choose your pickup day and time, then pay in store.',
      path: '/weekend-box'
    }),
  component: WeekendBoxPage
});

function WeekendBoxPage() {
  const { box } = Route.useLoaderData();
  return (
    <>
      <section className='border-b-2 border-ink bg-rye text-paper'>
        <div className='mx-auto grid max-w-[92rem] items-center gap-6 px-5 pt-10 pb-10 sm:px-8 md:grid-cols-2 md:py-16'>
          <div>
            <p className='label mb-4 text-butter'>Pay in store · No card needed</p>
            <h1 className='display text-[clamp(4rem,9vw,8.5rem)]'>{box.title}</h1>
            <p className='mt-5 max-w-xl text-lg leading-relaxed opacity-90'>{box.blurb}</p>
          </div>
          <Art
            name='box'
            label={`A kraft box from ${business.name} with a loaf, a croissant, and a cinnamon roll tucked inside.`}
            className='mx-auto w-full max-w-xl'
          />
        </div>
      </section>
      <div className='mx-auto grid max-w-[92rem] gap-10 px-5 py-10 sm:px-8 md:grid-cols-12 md:gap-8 md:py-16'>
        <aside className='min-w-0 md:col-span-4'>
          <div className='md:sticky md:top-32'>
            <div className='flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3'>
              <h2 className='text-3xl font-medium'>In the box</h2>
              <span className='font-mono text-xl'>{formatPrice(box.priceCents)}</span>
            </div>
            <ul className='divide-y divide-ink/25 border-b border-ink/25'>
              {box.items.map((item) => (
                <li key={item} className='py-2.5 text-lg'>
                  {item}
                </li>
              ))}
            </ul>
            <p className='mt-4 leading-snug opacity-85'>
              Pick up at {fullAddress()}. Pay with cash or card when you collect it.
            </p>
          </div>
        </aside>
        <div className='min-w-0 md:col-span-7 md:col-start-6'>
          <ReservationForm />
        </div>
      </div>
    </>
  );
}

function StepHeading({ number, children }: { number: number; children: string }) {
  return (
    <legend className='mb-3 flex items-baseline gap-3 text-[1.65rem] leading-tight font-medium font-[family-name:var(--font-display)]'>
      <span className='font-mono text-base text-crust' aria-hidden='true'>
        {number}.
      </span>
      {children}
    </legend>
  );
}

function ReservationForm() {
  const { days, box, maxPerReservation } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const groupId = useId();
  const alertRef = useRef<HTMLDivElement>(null);

  const firstOpenDay =
    days.find((day) => day.slots.some((slot) => slot.remaining > 0))?.date ??
    days[0]?.date ??
    '';
  const [date, setDate] = useState(firstOpenDay);
  const [time, setTime] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  const day = days.find((entry) => entry.date === date);
  const slot = day?.slots.find((entry) => entry.time === time);

  // Availability can change after a failed booking refreshes this page.
  useEffect(() => {
    if (time && (!slot || slot.remaining === 0)) setTime('');
  }, [slot, time]);

  const submit = useMutation({
    mutationFn: () =>
      submitReservation({
        data: { date, time, quantity, name, email, phone, website }
      }),
    onSuccess: async (result) => {
      if (result.ok) {
        await navigate({
          to: '/reservation/$token',
          params: { token: result.token }
        });
        return;
      }
      if (result.code === 'slot_full' || result.code === 'slot_closed') {
        await router.invalidate();
      }
      alertRef.current?.scrollIntoView({ block: 'center' });
    }
  });

  const failure = submit.data && !submit.data.ok ? submit.data : null;
  const errors = failure?.errors ?? {};
  const overSlot = slot ? quantity > slot.remaining : false;

  if (!days.length) {
    return (
      <div className='border-2 border-ink bg-paper-deep p-6'>
        <h2 className='display text-4xl'>No pickups open right now</h2>
        <p className='mt-3 text-lg'>
          Reservations will open again soon. Call us at {business.contact.phone}, and we’ll see
          what we can do.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className='space-y-9'
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
    >
      <h2 className='display text-5xl md:text-6xl'>Reserve yours</h2>

      <fieldset>
        <StepHeading number={1}>Choose a pickup day</StepHeading>
        <div className='no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pt-0.5 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0'>
          {days.map((entry) => {
            const left = entry.slots.reduce((sum, item) => sum + item.remaining, 0);
            const [weekday, monthDay] = formatDate(entry.date, 'medium').split(', ');
            const checked = entry.date === date;
            return (
              <label
                key={entry.date}
                className={`relative block w-32 shrink-0 cursor-pointer border-2 border-ink p-3 transition-colors sm:w-auto ${
                  checked ? 'bg-ink text-paper' : 'bg-transparent'
                } ${left === 0 ? 'cursor-not-allowed opacity-50' : ''} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crust`}
              >
                <input
                  type='radio'
                  className='sr-only'
                  name={`${groupId}-day`}
                  value={entry.date}
                  checked={checked}
                  disabled={left === 0}
                  onChange={() => {
                    setDate(entry.date);
                    setTime('');
                  }}
                />
                <span className='label block'>{weekday}</span>
                <span className='mt-1 block text-[1.4rem] leading-none font-medium font-[family-name:var(--font-display)]'>
                  {monthDay}
                </span>
                <span className='mt-2 block text-sm opacity-85'>
                  {left === 0 ? 'Fully booked' : `${left} ${left === 1 ? 'box' : 'boxes'} left`}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <StepHeading number={2}>Choose a time</StepHeading>
        <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3'>
          {day?.slots.map((entry) => {
            const full = entry.remaining === 0;
            const checked = entry.time === time;
            return (
              <label
                key={entry.time}
                data-slot-time={entry.time}
                className={`relative flex min-h-[4.25rem] flex-col justify-center border-2 border-ink px-3 py-2 transition-colors ${
                  full
                    ? 'cursor-not-allowed border-dashed opacity-55'
                    : 'cursor-pointer'
                } ${checked ? 'bg-crust text-[#fffaf0]' : ''} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crust`}
              >
                <input
                  type='radio'
                  className='sr-only'
                  name={`${groupId}-time`}
                  value={entry.time}
                  checked={checked}
                  disabled={full}
                  onChange={() => setTime(entry.time)}
                />
                <span className='text-lg font-semibold'>{formatTime(entry.time)}</span>
                <span className='text-sm'>
                  {full
                    ? 'Full'
                    : entry.remaining <= 2
                      ? `Only ${entry.remaining} left`
                      : `${entry.remaining} left`}
                </span>
              </label>
            );
          })}
        </div>
        {errors.time ? <p className='mt-2 font-medium text-destructive'>{errors.time}</p> : null}
      </fieldset>

      <fieldset>
        <StepHeading number={3}>How many boxes?</StepHeading>
        <div className='flex items-center gap-4'>
          <div className='inline-flex items-stretch border-2 border-ink'>
            <button
              type='button'
              aria-label='One box fewer'
              className='flex size-13 items-center justify-center disabled:opacity-35'
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => value - 1)}
            >
              <MinusIcon className='size-5' aria-hidden='true' />
            </button>
            <output
              aria-live='polite'
              aria-label='Number of boxes'
              className='flex w-14 items-center justify-center border-x-2 border-ink font-mono text-xl'
            >
              {quantity}
            </output>
            <button
              type='button'
              aria-label='One box more'
              className='flex size-13 items-center justify-center disabled:opacity-35'
              disabled={quantity >= maxPerReservation}
              onClick={() => setQuantity((value) => value + 1)}
            >
              <PlusIcon className='size-5' aria-hidden='true' />
            </button>
          </div>
          <p className='leading-tight'>
            <span className='font-mono text-xl'>{formatPrice(quantity * box.priceCents)}</span>
            <br />
            <span className='text-sm opacity-85'>Pay in store</span>
          </p>
        </div>
        {overSlot && slot ? (
          <p className='mt-2 font-medium text-destructive'>
            Only {slot.remaining} left at {formatTime(time)}. Choose fewer boxes or another time.
          </p>
        ) : null}
      </fieldset>

      <fieldset className='space-y-4'>
        <StepHeading number={4}>Your details</StepHeading>
        <Field
          label='Name for the pickup'
          name='name'
          autoComplete='name'
          value={name}
          onChange={setName}
          error={errors.name}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field
            label='Email'
            hint='Your confirmation goes here'
            name='email'
            type='email'
            autoComplete='email'
            inputMode='email'
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <Field
            label='Phone'
            hint='Only if we need to reach you'
            name='phone'
            type='tel'
            autoComplete='tel'
            inputMode='tel'
            value={phone}
            onChange={setPhone}
            error={errors.phone}
          />
        </div>
        <Honeypot value={website} onChange={setWebsite} />
      </fieldset>

      <div ref={alertRef} className='scroll-mt-28'>
        {failure ? <FormAlert>{failure.message}</FormAlert> : null}
        {submit.error ? (
          <FormAlert>
            Something went wrong on our end. Please try again, or call us at{' '}
            {business.contact.phone}.
          </FormAlert>
        ) : null}
      </div>

      <div className='border-t-2 border-ink pt-5'>
        {slot ? (
          <p className='mb-3 text-lg leading-snug'>
            {quantity} {quantity === 1 ? 'box' : 'boxes'} on {formatDate(date)} at{' '}
            {formatTime(time)}.
          </p>
        ) : (
          <p className='mb-3 text-lg leading-snug opacity-80'>Choose a pickup time to continue.</p>
        )}
        <button
          type='submit'
          className='btn btn-primary w-full sm:w-auto'
          data-testid='reserve-submit'
          disabled={!slot || overSlot || submit.isPending}
        >
          {submit.isPending ? 'Reserving…' : 'Reserve and pay in store'}
        </button>
      </div>
    </form>
  );
}
