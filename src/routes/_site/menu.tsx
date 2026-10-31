import { createFileRoute, Link } from '@tanstack/react-router';
import { business } from '~/business.config';
import { Sprig } from '~/components/art';
import { ItemLabels, MenuArtwork } from '~/components/site/menu-art';
import { menuCategories } from '~/db/schema';
import { formatPrice } from '~/lib/format';
import { getMenuPage } from '~/lib/public.functions';
import { seo } from '~/utils/seo';

const categoryCopy = {
  breads: {
    title: 'Breads',
    intro: 'Long-fermented, hand-shaped, and baked hard. Out of the oven before sunrise.'
  },
  pastries: {
    title: 'Pastries',
    intro: 'Laminated by hand over three days, and baked in small batches all morning.'
  },
  coffee: {
    title: 'Coffee',
    intro: 'Roasted nearby and pulled with care. The right company for anything on this page.'
  }
};

export const Route = createFileRoute('/_site/menu')({
  loader: () => getMenuPage(),
  head: () =>
    seo({
      title: `Menu: Sourdough, pastries, and coffee | ${business.name}`,
      description:
        'Sourdough loaves from $9, butter croissants, cinnamon rolls, and coffee. See today’s menu, prices, and dietary labels.',
      path: '/menu'
    }),
  component: MenuPage
});

function MenuPage() {
  const { items } = Route.useLoaderData();
  return (
    <>
      <section className='mx-auto max-w-[92rem] px-5 pt-10 pb-8 sm:px-8 md:pt-16'>
        <p className='label mb-4 text-crust'>Baked this morning</p>
        <h1 className='display text-[clamp(5rem,15vw,14rem)]'>The menu</h1>
        <p className='mt-5 max-w-xl text-xl leading-snug'>
          Everything is made here, from flour and patience. When it’s gone, it’s gone, so
          we mark what has sold out for the day.
        </p>
      </section>

      <nav
        aria-label='Menu categories'
        className='sticky top-[5.75rem] z-20 border-y-2 border-ink bg-paper md:top-[5.5rem]'
      >
        <ul className='mx-auto flex max-w-[92rem] sm:px-8'>
          {menuCategories.map((category) => (
            <li key={category} className='flex-1 border-r border-ink last:border-r-0 sm:flex-none sm:border-r-0'>
              <Link
                to='.'
                hash={category}
                hashScrollIntoView={{ behavior: 'smooth' }}
                className='block px-3 py-3 text-center font-semibold sm:px-6 sm:first:pl-0'
              >
                {categoryCopy[category].title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className='mx-auto max-w-[92rem] px-5 pb-16 sm:px-8 md:pb-24'>
        {menuCategories.map((category) => {
          const copy = categoryCopy[category];
          const categoryItems = items.filter((item) => item.category === category);
          if (!categoryItems.length) return null;
          return (
            <section
              key={category}
              id={category}
              aria-labelledby={`${category}-heading`}
              className='scroll-mt-40 pt-12 md:grid md:grid-cols-12 md:gap-6 md:pt-20'
            >
              <header className='mb-6 md:col-span-3 md:mb-0'>
                <div className='md:sticky md:top-44'>
                  <h2 id={`${category}-heading`} className='display text-6xl lg:text-7xl'>
                    {copy.title}
                  </h2>
                  <p className='mt-3 leading-snug opacity-85'>{copy.intro}</p>
                  <Sprig className='mt-4 hidden w-28 text-crust md:block' />
                </div>
              </header>
              <ul className='grid gap-x-10 border-t-2 border-ink md:col-span-9 lg:grid-cols-2 lg:border-t-0'>
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className='grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 border-b border-ink/30 py-5 min-[360px]:grid-cols-[6.5rem_minmax(0,1fr)] min-[360px]:gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-5 lg:border-t-2 lg:border-t-ink lg:border-b-0'
                  >
                    <div className='relative aspect-[4/5] self-start overflow-hidden rounded-t-full border-[1.5px] border-ink'>
                      <MenuArtwork item={item} />
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-baseline gap-2'>
                        <h3
                          className={`min-w-0 text-[1.45rem] leading-tight font-medium sm:text-[1.65rem] ${item.soldOut ? 'opacity-70' : ''}`}
                        >
                          {item.name}
                        </h3>
                        <span className='leader h-[1em] min-w-2 flex-1' aria-hidden='true' />
                        <span
                          className={`shrink-0 font-mono text-[1.05rem] ${item.soldOut ? 'line-through opacity-60' : ''}`}
                        >
                          <span className='sr-only'>{item.soldOut ? 'Was ' : ''}Price: </span>
                          {formatPrice(item.priceCents)}
                        </span>
                      </div>
                      <p className='mt-1.5 mb-3 leading-snug opacity-85'>{item.description}</p>
                      <ItemLabels dietary={item.dietary} soldOut={item.soldOut} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <aside className='mt-16 grid items-center gap-5 border-2 border-ink bg-butter p-6 sm:grid-cols-[1fr_auto] md:p-9'>
          <div>
            <h2 className='display text-4xl md:text-5xl'>Want a little of everything?</h2>
            <p className='mt-2 text-lg leading-snug'>
              The weekend box has a loaf, pastries, butter, jam, and coffee. Reserve it ahead
              and pay at pickup.
            </p>
          </div>
          <Link to='/weekend-box' className='btn btn-ink'>
            Reserve a box
          </Link>
        </aside>
      </div>
    </>
  );
}
