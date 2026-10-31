import { useState } from 'react';
import type { ReactNode } from 'react';
import { PageHeading, useDashboard, useDashboardMutation } from '~/components/dashboard/shell';
import { Switch } from '~/components/ui/switch';
import { saveHours, savePickupSettings, saveWeekendBox } from '~/lib/owner.functions';
import type { WeekendBox } from '~/lib/sample-content';
import { dayName, formatTime } from '~/lib/schedule';
import type { PickupRules, WeeklyHours } from '~/lib/schedule';

const weekOrder = [1, 2, 3, 4, 5, 6, 0];

// Half-hour choices across a bakery's day, plus any time already in use.
const timeChoices = Array.from({ length: 21 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

function Panel({
  title,
  description,
  children,
  onSave,
  saving
}: {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  const { readOnly } = useDashboard();
  return (
    <section aria-label={title} className='border-2 border-ink'>
      <div className='border-b-2 border-ink bg-paper-deep p-4 sm:p-5'>
        <h2 className='text-3xl font-medium'>{title}</h2>
        <p className='mt-1 leading-snug opacity-85'>{description}</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <fieldset disabled={readOnly || saving} className='p-4 sm:p-5'>
          {children}
          <button type='submit' className='btn btn-primary mt-5 !min-h-11 !py-2 max-sm:w-full'>
            {readOnly ? 'Saving is off in the demo' : saving ? 'Saving…' : `Save ${title.toLowerCase()}`}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

function HoursPanel({ hours }: { hours: WeeklyHours }) {
  const { readOnly } = useDashboard();
  const [draft, setDraft] = useState(hours);
  const save = useDashboardMutation(() => saveHours({ data: draft }), { success: 'Hours saved' });

  const update = (weekday: number, field: 'open' | 'close', value: string) => {
    setDraft((current) => {
      const day = current[weekday] ?? { open: '08:00', close: '14:00' };
      return { ...current, [weekday]: { ...day, [field]: value } };
    });
  };

  return (
    <Panel
      title='Opening hours'
      description='Shown across the site and in search results. Pickups can only be booked while you’re open.'
      saving={save.isPending}
      onSave={() => save.mutate(undefined)}
    >
      <ul className='divide-y divide-ink/25'>
        {weekOrder.map((weekday) => {
          const day = draft[weekday] ?? null;
          return (
            <li key={weekday} className='grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-2.5 sm:grid-cols-[8rem_auto_1fr]'>
              <span className='font-semibold'>{dayName(weekday)}</span>
              <label className='flex items-center gap-2 text-sm'>
                {day ? 'Open' : 'Closed'}
                <Switch
                  checked={Boolean(day)}
                  disabled={readOnly}
                  aria-label={`Open on ${dayName(weekday)}`}
                  onCheckedChange={(open) =>
                    setDraft((current) => ({
                      ...current,
                      [weekday]: open ? { open: '08:00', close: '14:00' } : null
                    }))
                  }
                />
              </label>
              {day ? (
                <div className='col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end'>
                  <input
                    type='time'
                    step={900}
                    aria-label={`${dayName(weekday)} opening time`}
                    className='field-input !min-h-10 !py-1 font-mono sm:w-36'
                    value={day.open}
                    onChange={(event) => update(weekday, 'open', event.target.value)}
                  />
                  <span aria-hidden='true'>to</span>
                  <input
                    type='time'
                    step={900}
                    aria-label={`${dayName(weekday)} closing time`}
                    className='field-input !min-h-10 !py-1 font-mono sm:w-36'
                    value={day.close}
                    onChange={(event) => update(weekday, 'close', event.target.value)}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function ToggleChip({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`relative cursor-pointer border-[1.5px] border-ink px-2.5 py-1.5 font-medium has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-crust ${checked ? 'bg-ink text-paper' : ''}`}
    >
      <input type='checkbox' className='sr-only' checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function PickupPanel({ pickup }: { pickup: PickupRules }) {
  const [capacity, setCapacity] = useState(String(pickup.capacityPerSlot));
  const [days, setDays] = useState(pickup.days);
  const [times, setTimes] = useState(pickup.times);
  const save = useDashboardMutation(
    () =>
      savePickupSettings({
        data: { capacityPerSlot: Number(capacity), days, times }
      }),
    { success: 'Pickup settings saved' }
  );

  const choices = [...new Set([...timeChoices, ...pickup.times])].sort();

  return (
    <Panel
      title='Pickup capacity'
      description='How many boxes you can hand over in each slot. The site won’t let anyone book past this number.'
      saving={save.isPending}
      onSave={() => save.mutate(undefined)}
    >
      <label className='block max-w-48'>
        <span className='mb-1 block font-semibold'>Boxes per time slot</span>
        <input
          type='number'
          min={0}
          inputMode='numeric'
          className='field-input font-mono'
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />
      </label>
      <fieldset className='mt-5'>
        <legend className='mb-1.5 font-semibold'>Pickup days</legend>
        <div className='flex flex-wrap gap-2'>
          {weekOrder.map((weekday) => (
            <ToggleChip
              key={weekday}
              label={dayName(weekday).slice(0, 3)}
              checked={days.includes(weekday)}
              onChange={() =>
                setDays((current) =>
                  current.includes(weekday)
                    ? current.filter((value) => value !== weekday)
                    : [...current, weekday]
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset className='mt-5'>
        <legend className='mb-1.5 font-semibold'>Pickup times</legend>
        <div className='flex flex-wrap gap-2'>
          {choices.map((time) => (
            <ToggleChip
              key={time}
              label={formatTime(time)}
              checked={times.includes(time)}
              onChange={() =>
                setTimes((current) =>
                  current.includes(time)
                    ? current.filter((value) => value !== time)
                    : [...current, time]
                )
              }
            />
          ))}
        </div>
      </fieldset>
    </Panel>
  );
}

function BoxPanel({ box }: { box: WeekendBox }) {
  const [title, setTitle] = useState(box.title);
  const [price, setPrice] = useState((box.priceCents / 100).toFixed(2));
  const [blurb, setBlurb] = useState(box.blurb);
  const [items, setItems] = useState(box.items.join('\n'));
  const save = useDashboardMutation(
    () =>
      saveWeekendBox({
        data: {
          title,
          blurb,
          priceCents: Math.round(Number(price.replace(/[$\s,]/g, '')) * 100),
          items: items.split('\n')
        }
      }),
    { success: 'Weekend box saved' }
  );

  return (
    <Panel
      title='Weekend box'
      description='What’s inside and what it costs. Existing reservations keep the price they were booked at.'
      saving={save.isPending}
      onSave={() => save.mutate(undefined)}
    >
      <div className='space-y-4'>
        <div className='grid grid-cols-[1fr_7rem] gap-3'>
          <label className='block'>
            <span className='mb-1 block font-semibold'>Name</span>
            <input className='field-input' value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className='block'>
            <span className='mb-1 block font-semibold'>Price ($)</span>
            <input
              className='field-input font-mono'
              inputMode='decimal'
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
        </div>
        <label className='block'>
          <span className='mb-1 block font-semibold'>Description</span>
          <textarea className='field-input' rows={3} value={blurb} onChange={(event) => setBlurb(event.target.value)} />
        </label>
        <label className='block'>
          <span className='mb-1 block font-semibold'>What’s inside (one per line)</span>
          <textarea className='field-input' rows={6} value={items} onChange={(event) => setItems(event.target.value)} />
        </label>
      </div>
    </Panel>
  );
}

export function SettingsView({
  hours,
  pickup,
  box
}: {
  hours: WeeklyHours;
  pickup: PickupRules;
  box: WeekendBox;
}) {
  return (
    <>
      <PageHeading eyebrow='Your bakery' title='Settings' />
      <div className='grid items-start gap-6 lg:grid-cols-2'>
        <HoursPanel hours={hours} />
        <div className='space-y-6'>
          <PickupPanel pickup={pickup} />
          <BoxPanel box={box} />
        </div>
      </div>
    </>
  );
}
