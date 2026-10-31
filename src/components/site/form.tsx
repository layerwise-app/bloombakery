import { useId } from 'react';
import type { HTMLInputTypeAttribute, ReactNode } from 'react';

export function Field({
  label,
  hint,
  name,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  inputMode,
  multiline = false,
  optional = false
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel';
  multiline?: boolean;
  optional?: boolean;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const shared = {
    id,
    name,
    value,
    autoComplete,
    className: 'field-input',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    required: !optional
  } as const;
  return (
    <div>
      <label htmlFor={id} className='mb-1.5 block font-semibold'>
        {label}
        {optional ? <span className='font-normal opacity-70'> (optional)</span> : null}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className='mt-1.5 font-medium text-destructive'>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className='mt-1.5 text-sm opacity-75'>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A field people never see or reach, which form-filling bots tend to complete.
 * The server rejects any submission where it isn't empty.
 */
export function Honeypot({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='honeypot' aria-hidden='true'>
      <label>
        Website
        <input
          type='text'
          name='website'
          tabIndex={-1}
          autoComplete='off'
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role='alert'
      className='mb-4 border-2 border-destructive bg-[color-mix(in_oklab,var(--destructive)_9%,var(--paper))] px-4 py-3 font-medium text-destructive'
    >
      {children}
    </div>
  );
}
