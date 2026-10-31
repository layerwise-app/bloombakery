import { useState } from 'react';
import { MailIcon, PhoneIcon } from 'lucide-react';
import { business } from '~/business.config';
import { EmptyState, PageHeading, useDashboard, useDashboardMutation } from '~/components/dashboard/shell';
import { formatStamp } from '~/lib/format';
import { deleteMessage, setMessageRead } from '~/lib/owner.functions';

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

function MessageCard({ message }: { message: MessageRow }) {
  const { readOnly } = useDashboard();
  const [confirming, setConfirming] = useState(false);
  const toggle = useDashboardMutation((read: boolean) =>
    setMessageRead({ data: { id: message.id, read } })
  );
  const remove = useDashboardMutation(() => deleteMessage({ data: { id: message.id } }), {
    success: 'Message deleted'
  });

  return (
    <li className={`border-2 p-4 sm:p-5 ${message.read ? 'border-ink/30' : 'border-ink bg-[color-mix(in_oklab,var(--paper)_45%,white)]'}`}>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 className='flex items-center gap-2 text-2xl font-medium'>
          {message.read ? null : (
            <span className='inline-block size-2.5 rounded-full bg-crust' role='img' aria-label='Unread' />
          )}
          {message.name}
        </h2>
        <span className='font-mono text-sm opacity-80'>{formatStamp(message.createdAt, business.timeZone)}</span>
      </div>
      <p className='mt-2 text-lg leading-snug whitespace-pre-wrap'>{message.message}</p>
      <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem]'>
        <a href={`mailto:${message.email}`} className='flex items-center gap-1.5 font-semibold underline underline-offset-4'>
          <MailIcon className='size-4' aria-hidden='true' />
          {message.email}
        </a>
        {message.phone ? (
          <a href={`tel:${message.phone.replace(/[^\d+]/g, '')}`} className='flex items-center gap-1.5 underline underline-offset-4'>
            <PhoneIcon className='size-4' aria-hidden='true' />
            {message.phone}
          </a>
        ) : null}
        <span className='ml-auto flex items-center gap-4'>
          <button
            type='button'
            disabled={readOnly || toggle.isPending}
            className='underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'
            onClick={() => toggle.mutate(!message.read)}
          >
            Mark as {message.read ? 'unread' : 'read'}
          </button>
          {confirming ? (
            <>
              <button
                type='button'
                className='font-semibold text-destructive underline underline-offset-4'
                disabled={remove.isPending}
                onClick={() => remove.mutate(undefined)}
              >
                Confirm delete
              </button>
              <button type='button' className='underline underline-offset-4' onClick={() => setConfirming(false)}>
                Keep
              </button>
            </>
          ) : (
            <button
              type='button'
              disabled={readOnly}
              className='underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'
              onClick={() => setConfirming(true)}
            >
              Delete
            </button>
          )}
        </span>
      </div>
    </li>
  );
}

export function MessagesView({ messages }: { messages: MessageRow[] }) {
  const unread = messages.filter((message) => !message.read).length;
  return (
    <>
      <PageHeading eyebrow={`${unread} unread`} title='Messages' />
      {messages.length === 0 ? (
        <EmptyState title='No messages yet'>
          Notes from the contact form on the Visit page will appear here.
        </EmptyState>
      ) : (
        <ul className='space-y-3'>
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </ul>
      )}
    </>
  );
}
