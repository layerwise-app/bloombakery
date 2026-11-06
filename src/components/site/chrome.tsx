import { useEffect, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { MenuIcon, PhoneIcon, XIcon } from 'lucide-react';
import { BloomMark } from '~/components/art';
import { business, fullAddress, phoneHref } from '~/business.config';
import { groupHours } from '~/lib/schedule';
import type { WeeklyHours } from '~/lib/schedule';

const navLinks = [
  { to: '/menu', label: 'Menu' },
  { to: '/weekend-box', label: 'Weekend box' },
  { to: '/visit', label: 'Visit' }
] as const;

export type SiteInfo = {
  hours: WeeklyHours;
  status: { isOpen: boolean; label: string };
  todayLabel: string;
  todayShort: string;
  todayWeekday: number;
};

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      to='/'
      className={`flex items-center gap-2.5 text-ink ${className}`}
      aria-label={`${business.name} home`}
    >
      <BloomMark className='size-8 text-crust' />
      <span className='display text-[1.65rem] leading-none'>{business.name}</span>
    </Link>
  );
}

export function SiteHeader({ info }: { info: SiteInfo }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className='sticky top-0 z-40 border-b-2 border-ink bg-paper'>
      <div className='border-b border-border'>
        <div className='label mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-1.5 sm:px-8'>
          <span className='truncate min-[420px]:hidden'>{info.todayShort}</span>
          <span className='truncate max-[419px]:hidden'>{info.todayLabel}</span>
          <span className='flex shrink-0 items-center gap-2'>
            <span
              className={`inline-block size-2 rounded-full ${info.status.isOpen ? 'bg-sage' : 'bg-crust'}`}
              aria-hidden='true'
            />
            {info.status.label}
          </span>
        </div>
      </div>
      <div className='mx-auto grid max-w-[92rem] grid-cols-[1fr_auto] items-center gap-4 px-5 py-2.5 sm:px-8 md:grid-cols-[1fr_auto_1fr]'>
        <nav aria-label='Main' className='hidden items-center gap-7 md:flex'>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className='font-medium underline-offset-4 hover:underline'
              activeProps={{ className: 'text-crust underline' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Wordmark />
        <div className='hidden items-center justify-end gap-5 md:flex'>
          <a href={phoneHref()} className='font-medium underline-offset-4 hover:underline'>
            {business.contact.phone}
          </a>
          <Link to='/weekend-box' className='btn btn-primary !min-h-0 !py-2 text-sm'>
            Reserve a box
          </Link>
        </div>
        <button
          type='button'
          className='-mr-2 flex size-11 items-center justify-center md:hidden'
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls='mobile-nav'
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <XIcon className='size-7' /> : <MenuIcon className='size-7' />}
        </button>
      </div>
      {open ? (
        <nav
          id='mobile-nav'
          aria-label='Mobile'
          className='absolute inset-x-0 top-full z-40 flex h-[calc(100dvh-5.5rem)] flex-col overflow-y-auto border-t-2 border-ink bg-paper px-5 pb-10 md:hidden'
        >
          <ul className='divide-y divide-border border-b border-border'>
            {[{ to: '/', label: 'Home' } as const, ...navLinks].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className='display block py-5 text-5xl'
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className='mt-8 space-y-2 text-lg'>
            <a href={phoneHref()} className='block font-medium underline underline-offset-4'>
              {business.contact.phone}
            </a>
            <p>{fullAddress()}</p>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

/** Fixed thumb-reach actions for phones, where most visitors arrive. */
export function MobileActionBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === '/weekend-box' || pathname.startsWith('/reservation')) {
    return null;
  }
  return (
    <div className='fixed inset-x-0 bottom-0 z-30 grid grid-cols-[auto_1fr] border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden'>
      <a
        href={phoneHref()}
        aria-label={`Call ${business.name}`}
        className='flex items-center gap-2 border-r-2 border-ink px-5 py-4 font-semibold'
      >
        <PhoneIcon className='size-4' aria-hidden='true' />
        Call
      </a>
      <Link
        to='/weekend-box'
        className='flex items-center justify-center bg-crust px-4 py-4 font-semibold text-[#fffaf0]'
      >
        Reserve a weekend box
      </Link>
    </div>
  );
}

export function HoursTable({
  hours,
  today,
  className = ''
}: {
  hours: WeeklyHours;
  today?: number;
  className?: string;
}) {
  const rows = groupHours(hours);
  return (
    <dl className={className} data-today={today}>
      {rows.map((row) => (
        <div key={row.label} className='flex items-baseline gap-3 py-1.5'>
          <dt className='font-medium'>{row.label}</dt>
          <span className='leader h-[1em] flex-1' aria-hidden='true' />
          <dd className={`font-mono text-[0.94rem] ${row.closed ? 'opacity-70' : ''}`}>
            {row.hours}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SiteFooter({ info }: { info: SiteInfo }) {
  return (
    <footer className='bg-ink pb-20 text-paper md:pb-0'>
      <div className='mx-auto max-w-[92rem] px-5 pt-14 pb-10 sm:px-8'>
        <p className='display text-[clamp(3.6rem,16.5vw,14.5rem)] leading-[0.82] text-butter'>
          {business.name}
        </p>
        <p className='mt-6 max-w-md text-lg opacity-90'>{business.tagline}</p>
        <div className='mt-12 grid gap-10 border-t border-paper/25 pt-8 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <h2 className='label mb-3 font-sans text-butter'>Find us</h2>
            <address className='not-italic leading-relaxed'>
              {business.contact.street}
              <br />
              {business.contact.city}, {business.contact.region}{' '}
              {business.contact.postalCode}
            </address>
            <p className='mt-3'>
              <a href={phoneHref()} className='underline underline-offset-4'>
                {business.contact.phone}
              </a>
              <br />
              <a
                href={`mailto:${business.contact.email}`}
                className='break-all underline underline-offset-4'
              >
                {business.contact.email}
              </a>
            </p>
          </div>
          <div>
            <h2 className='label mb-3 font-sans text-butter'>Hours</h2>
            <HoursTable hours={info.hours} className='max-w-xs' />
          </div>
          <div>
            <h2 className='label mb-3 font-sans text-butter'>Around here</h2>
            <ul className='space-y-2'>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className='underline-offset-4 hover:underline'>
                    {link.label}
                  </Link>
                </li>
              ))}
              {business.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    rel='noopener noreferrer'
                    target='_blank'
                    className='underline-offset-4 hover:underline'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className='label mb-3 font-sans text-butter'>Behind the counter</h2>
            <ul className='space-y-2'>
              {business.demoDashboard ? (
                <li>
                  <Link to='/demo' className='underline underline-offset-4'>
                    View demo dashboard
                  </Link>
                </li>
              ) : null}
              <li>
                <Link to='/sign-in' className='underline-offset-4 hover:underline'>
                  Owner sign-in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-5'>
          <p className='label opacity-75'>
            Since {business.established} · {business.neighborhood}
          </p>
          <a
            href='https://layerwise.app'
            target='_blank'
            rel='noopener noreferrer'
            className='shrink-0'
          >
            <img
              src='https://layerwise.app/powered-by-dark.png'
              alt='Powered by Layerwise'
              width={174}
              height={28}
              loading='lazy'
              className='block h-[28px] w-[174px]'
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
