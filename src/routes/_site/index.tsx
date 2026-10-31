import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { business, fullAddress, phoneHref } from '~/business.config';
import { Art, Sprig } from '~/components/art';
import { HoursTable } from '~/components/site/chrome';
import { ItemLabels, MenuArtwork } from '~/components/site/menu-art';
import { StoreMap } from '~/components/site/store-map';
import { formatPrice } from '~/lib/format';
import { getHomePage } from '~/lib/public.functions';
import { formatDate } from '~/lib/schedule';
import { bakeryJsonLd } from '~/lib/structured-data';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/_site/')({
  loader: () => getHomePage(),
  head: ({ loaderData }) =>
    seo({
      title: `${business.name}: Fresh sourdough, baked at dawn`,
      description: business.description,
      path: '/',
      jsonLd: loaderData ? bakeryJsonLd(loaderData.hours) : undefined
    }),
  component: Home
});

function Home() {
  const { featured, quotes, box, hours, nextPickupDate } = Route.useLoaderData();
  const [leadQuote, ...otherQuotes] = quotes;

  return (
    <>
      <section className='mx-auto grid max-w-[92rem] gap-8 px-5 pt-8 pb-10 sm:px-8 md:grid-cols-12 md:gap-6 md:pt-12 md:pb-16'>
        <div className='reveal-rise relative z-10 flex min-w-0 flex-col justify-between md:col-span-7'>
          <div>
            <p className='label mb-5 text-crust'>
              {business.neighborhood} · Since {business.established}
            </p>
            <h1 className='display text-[clamp(3.1rem,16.2vw,4.5rem)] sm:text-[6.5rem] md:mr-[-14%] md:text-[clamp(4rem,10.4vw,11.5rem)]'>
              {business.headline.split(', ').map((part, index) => (
                <span key={part} className={index ? 'block italic text-crust' : 'block'}>
                  {index ? part : `${part},`}
                </span>
              ))}
            </h1>
          </div>
          <div className='mt-7 md:mt-10 md:border-t-2 md:border-ink md:pt-6'>
            <p className='max-w-md text-xl leading-snug sm:text-2xl'>{business.tagline}</p>
            <div className='mt-7 flex flex-wrap gap-3'>
              <Link to='/weekend-box' className='btn btn-primary whitespace-nowrap max-sm:flex-auto'>
                <span className='sm:hidden'>Reserve a box</span>
                <span className='hidden sm:inline'>Reserve the weekend box</span>
              </Link>
              <Link to='/menu' className='btn btn-ghost whitespace-nowrap max-sm:flex-auto'>
                See the menu
              </Link>
            </div>
          </div>
        </div>
        <div className='reveal-rise min-w-0 md:col-span-5'>
          <div className='arch mx-auto aspect-[4/5] w-full border-2 border-ink md:max-w-xl'>
            <Art
              name='hero'
              label='A round sourdough loaf, a croissant, and a cinnamon roll on a wooden counter in front of a rising sun over the neighborhood rooftops.'
              className='size-full'
              preserveAspectRatio='xMidYMax slice'
            />
          </div>
        </div>
      </section>

      <section aria-labelledby='featured-heading' className='border-t-2 border-ink'>
        <div className='mx-auto max-w-[92rem] px-5 py-12 sm:px-8 md:py-20'>
          <div className='mb-8 flex items-end justify-between gap-6 md:mb-12'>
            <div>
              <p className='label mb-3 text-crust'>This morning’s rack</p>
              <h2 id='featured-heading' className='display text-5xl md:text-7xl'>
                What we’re known for
              </h2>
            </div>
            <Link
              to='/menu'
              className='hidden shrink-0 items-center gap-2 font-semibold underline underline-offset-4 md:flex'
            >
              The full menu <ArrowRightIcon className='size-4' aria-hidden='true' />
            </Link>
          </div>
          <ul className='no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0'>
            {featured.map((item) => (
              <li key={item.id} className='w-[74vw] max-w-80 shrink-0 snap-center md:w-auto md:max-w-none'>
                <Link to='/menu' hash={item.category} className='group block'>
                  <div className='arch aspect-[4/5] border-2 border-ink transition-transform duration-300 group-hover:-translate-y-1'>
                    <MenuArtwork item={item} />
                  </div>
                  <div className='mt-4 flex items-baseline justify-between gap-3'>
                    <h3 className='text-2xl leading-tight font-medium'>{item.name}</h3>
                    <span className='font-mono text-lg'>{formatPrice(item.priceCents)}</span>
                  </div>
                  <p className='mt-1.5 mb-2.5 leading-snug opacity-85'>{item.description}</p>
                  <ItemLabels dietary={item.dietary} soldOut={item.soldOut} />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to='/menu'
            className='mt-7 flex items-center gap-2 font-semibold underline underline-offset-4 md:hidden'
          >
            The full menu <ArrowRightIcon className='size-4' aria-hidden='true' />
          </Link>
        </div>
      </section>

      <section aria-labelledby='box-heading' className='bg-rye text-paper'>
        <div className='mx-auto grid max-w-[92rem] items-center gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 md:py-24'>
          <div className='order-2 md:order-1'>
            <p className='label mb-3 text-butter'>Reserve ahead, pay in store</p>
            <h2 id='box-heading' className='display text-[clamp(3.25rem,7vw,6.5rem)]'>
              {box.title}
            </h2>
            <p className='mt-5 max-w-xl text-lg leading-relaxed opacity-90'>{box.blurb}</p>
            <ul className='mt-6 max-w-xl border-t border-paper/30'>
              {box.items.map((item) => (
                <li key={item} className='border-b border-paper/30 py-2.5 text-lg'>
                  {item}
                </li>
              ))}
            </ul>
            <div className='mt-7 flex flex-wrap items-center gap-x-6 gap-y-4'>
              <Link to='/weekend-box' className='btn btn-ink !border-butter !bg-butter !text-ink max-sm:w-full'>
                Reserve for {formatPrice(box.priceCents)}
                <ArrowRightIcon className='size-4' aria-hidden='true' />
              </Link>
              {nextPickupDate ? (
                <p className='label text-butter'>
                  Next pickup {formatDate(nextPickupDate, 'medium')}
                </p>
              ) : null}
            </div>
          </div>
          <div className='order-1 md:order-2'>
            <Art
              name='box'
              label={`A kraft box from ${business.name} with a loaf, a croissant, and a cinnamon roll tucked inside.`}
              className='w-full'
            />
          </div>
        </div>
      </section>

      <section aria-labelledby='story-heading'>
        <div className='mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:px-8 md:grid-cols-12 md:py-24'>
          <div className='md:col-span-5'>
            <p className='label mb-3 text-crust'>Our story</p>
            <h2 id='story-heading' className='display text-[clamp(3rem,5.6vw,5.5rem)]'>
              {business.story.title}
            </h2>
            <Sprig className='mt-7 w-32 text-crust' />
          </div>
          <div className='md:col-span-6 md:col-start-7'>
            <div className='space-y-5 text-lg leading-relaxed sm:text-xl'>
              {business.story.paragraphs.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={
                    index === 0
                      ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-2.5 first-letter:font-[family-name:var(--font-display)] first-letter:text-[4.8rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-crust'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <figure className='my-9 border-y-2 border-ink py-6'>
              <blockquote className='display text-3xl leading-[1.08] italic sm:text-4xl'>
                “{business.story.pullQuote}”
              </blockquote>
            </figure>
            <h3 className='label mb-4 font-sans text-crust'>A morning at the bakery</h3>
            <ol className='space-y-4'>
              {business.story.morning.map((step) => (
                <li key={step.time} className='grid grid-cols-[5.5rem_1fr] gap-3'>
                  <span className='pt-0.5 font-mono text-[0.95rem]'>{step.time}</span>
                  <span className='text-lg leading-snug'>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby='quotes-heading' className='border-y-2 border-ink bg-paper-deep'>
        <div className='mx-auto max-w-[92rem] px-5 py-14 sm:px-8 md:py-24'>
          <h2 id='quotes-heading' className='label mb-8 font-sans text-crust'>
            Overheard at the counter
          </h2>
          {leadQuote ? (
            <figure>
              <blockquote className='display max-w-6xl text-[clamp(2.4rem,5.6vw,5.5rem)] leading-[1.02]'>
                “{leadQuote.quote}”
              </blockquote>
              <figcaption className='mt-5 font-medium'>
                {leadQuote.author}
                <span className='opacity-70'> · {leadQuote.detail}</span>
              </figcaption>
            </figure>
          ) : null}
          <div className='mt-10 grid gap-8 border-t border-ink/30 pt-8 md:grid-cols-2 md:gap-12'>
            {otherQuotes.map((quote) => (
              <figure key={quote.id}>
                <blockquote className='text-2xl leading-snug font-[family-name:var(--font-display)]'>
                  “{quote.quote}”
                </blockquote>
                <figcaption className='mt-3 font-medium'>
                  {quote.author}
                  <span className='opacity-70'> · {quote.detail}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby='visit-heading'>
        <div className='mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 md:gap-14 md:py-24'>
          <div>
            <p className='label mb-3 text-crust'>Hours and location</p>
            <h2 id='visit-heading' className='display text-[clamp(3rem,5.6vw,5.5rem)]'>
              Come say good morning.
            </h2>
            <HoursTable hours={hours} className='mt-7 text-lg' />
            <address className='mt-6 text-lg not-italic'>
              {fullAddress()}
              <br />
              <a href={phoneHref()} className='font-semibold underline underline-offset-4'>
                {business.contact.phone}
              </a>
            </address>
            <Link to='/visit' className='btn btn-ghost mt-6 max-sm:w-full'>
              Directions and contact
            </Link>
          </div>
          <Link
            to='/visit'
            aria-label='Open the Visit page'
            className='block self-center border-2 border-ink'
          >
            <StoreMap className='block w-full' />
          </Link>
        </div>
      </section>

      <section aria-labelledby='cta-heading' className='border-t-2 border-ink bg-butter'>
        <div className='mx-auto max-w-[92rem] px-5 py-14 sm:px-8 md:py-24'>
          <h2 id='cta-heading' className='display max-w-5xl text-[clamp(3.4rem,9vw,9rem)]'>
            We stop when we <span className='italic'>sell out.</span>
          </h2>
          <p className='mt-5 max-w-xl text-xl leading-snug'>
            Reserve your weekend box now, and it’ll be waiting for you with your name on it.
          </p>
          <Link to='/weekend-box' className='btn btn-ink mt-7 max-sm:w-full'>
            Reserve the weekend box
            <ArrowRightIcon className='size-4' aria-hidden='true' />
          </Link>
        </div>
      </section>
    </>
  );
}
