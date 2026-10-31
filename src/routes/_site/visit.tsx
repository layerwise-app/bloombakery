import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { business, phoneHref } from '~/business.config';
import { HoursTable } from '~/components/site/chrome';
import { Field, FormAlert, Honeypot } from '~/components/site/form';
import { StoreMap } from '~/components/site/store-map';
import { getVisitPage, submitContactMessage } from '~/lib/public.functions';
import { bakeryJsonLd } from '~/lib/structured-data';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/_site/visit')({
  loader: () => getVisitPage(),
  head: ({ loaderData }) =>
    seo({
      title: `Visit: Hours, directions, and contact | ${business.name}`,
      description: `Find ${business.name} at ${business.contact.street}, ${business.contact.city}. See our hours, get directions, or send us a message.`,
      path: '/visit',
      jsonLd: loaderData ? bakeryJsonLd(loaderData.hours) : undefined
    }),
  component: VisitPage
});

function VisitPage() {
  const { hours } = Route.useLoaderData();
  const { contact } = business;
  return (
    <>
      <section className='mx-auto max-w-[92rem] px-5 pt-10 pb-8 sm:px-8 md:pt-16'>
        <p className='label mb-4 text-crust'>{business.neighborhood}</p>
        <h1 className='display text-[clamp(4.4rem,13vw,12rem)]'>Come by early.</h1>
      </section>

      <section className='border-y-2 border-ink'>
        <div className='mx-auto grid max-w-[92rem] sm:px-8 md:grid-cols-12 md:gap-10 md:py-12'>
          <div className='border-b-2 border-ink md:col-span-7 md:border-2'>
            <StoreMap className='block w-full' />
          </div>
          <div className='space-y-8 px-5 py-8 sm:px-0 md:col-span-5 md:py-0'>
            <div>
              <h2 className='label mb-2 font-sans text-crust'>Address</h2>
              <address className='text-2xl leading-tight font-medium not-italic font-[family-name:var(--font-display)]'>
                {contact.street}
                <br />
                {contact.city}, {contact.region} {contact.postalCode}
              </address>
              <p className='mt-3 leading-snug'>{contact.directions}</p>
            </div>
            <div>
              <h2 className='label mb-1 font-sans text-crust'>Hours</h2>
              <HoursTable hours={hours} className='text-lg' />
            </div>
            <div>
              <h2 className='label mb-2 font-sans text-crust'>Phone and email</h2>
              <p className='text-lg'>
                <a href={phoneHref()} className='font-semibold underline underline-offset-4'>
                  {contact.phone}
                </a>
                <br />
                <a
                  href={`mailto:${contact.email}`}
                  className='break-all underline underline-offset-4'
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby='contact-heading'>
        <div className='mx-auto grid max-w-[92rem] gap-8 px-5 py-14 sm:px-8 md:grid-cols-12 md:py-24'>
          <div className='md:col-span-5'>
            <h2 id='contact-heading' className='display text-[clamp(3.2rem,6vw,5.75rem)]'>
              Say hello.
            </h2>
            <p className='mt-5 max-w-md text-lg leading-relaxed'>
              Custom cakes, big orders, wholesale, or a kind word about the rye. Send us a note,
              and someone from the bakery will write back once the ovens are off.
            </p>
          </div>
          <div className='md:col-span-6 md:col-start-7'>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      submitContactMessage({ data: { name, email, phone, message, website } })
  });

  const result = submit.data;
  if (result?.ok) {
    return (
      <div role='status' className='border-2 border-ink bg-butter p-6 md:p-8'>
        <h3 className='display text-5xl'>Got it, thank you.</h3>
        <p className='mt-3 text-lg'>
          Your message is with the team. We’ll reply to {email} soon, usually once the morning
          rush is over.
        </p>
        <button
          type='button'
          className='btn btn-ghost mt-5'
          onClick={() => {
            setMessage('');
            submit.reset();
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const failure = result && !result.ok ? result : null;
  const errors = failure?.errors ?? {};

  return (
    <form
      noValidate
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label='Your name' name='name' autoComplete='name' value={name} onChange={setName} error={errors.name} />
        <Field label='Email' name='email' type='email' inputMode='email' autoComplete='email' value={email} onChange={setEmail} error={errors.email} />
      </div>
      <Field label='Phone' name='phone' type='tel' inputMode='tel' autoComplete='tel' optional value={phone} onChange={setPhone} error={errors.phone} />
      <Field label='Your message' name='message' multiline value={message} onChange={setMessage} error={errors.message} />
      <Honeypot value={website} onChange={setWebsite} />
      {failure && failure.code !== 'invalid' ? <FormAlert>{failure.message}</FormAlert> : null}
      {submit.error ? (
        <FormAlert>
          Something went wrong on our end. Please try again, or call us at {business.contact.phone}.
        </FormAlert>
      ) : null}
      <button type='submit' className='btn btn-primary w-full sm:w-auto' disabled={submit.isPending}>
        {submit.isPending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
