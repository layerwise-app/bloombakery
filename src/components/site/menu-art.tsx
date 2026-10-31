import { Art } from '~/components/art';

const tileColors: Record<string, string> = {
  breads: 'var(--paper-deep)',
  pastries: 'color-mix(in oklab, var(--butter) 42%, var(--paper))',
  coffee: 'color-mix(in oklab, var(--crust) 22%, var(--paper))'
};

/** An item's uploaded photo, or its illustration when it doesn't have one. */
export function MenuArtwork({
  item,
  className = ''
}: {
  item: {
    name: string;
    art: string;
    category: string;
    photoUrl: string | null;
    soldOut: boolean;
  };
  className?: string;
}) {
  const filter = item.soldOut ? 'grayscale-[0.75] opacity-70' : '';
  if (item.photoUrl) {
    return (
      <img
        src={item.photoUrl}
        alt={item.name}
        loading='lazy'
        decoding='async'
        className={`size-full object-cover ${filter} ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex size-full items-center justify-center p-[9%] ${className}`}
      style={{ background: tileColors[item.category] }}
    >
      <Art name={item.art} label={item.name} className={`size-full ${filter}`} />
    </div>
  );
}

/** Dietary labels, and a clear stamp for items that are gone for the day. */
export function ItemLabels({
  dietary,
  soldOut
}: {
  dietary: string[];
  soldOut: boolean;
}) {
  if (!dietary.length && !soldOut) return null;
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {soldOut ? (
        <li className='label bg-ink px-2 py-1 !text-[0.66rem] text-paper'>Sold out</li>
      ) : null}
      {dietary.map((label) => (
        <li
          key={label}
          className={`label border px-2 py-[0.2rem] !text-[0.66rem] ${
            label === 'Contains nuts'
              ? 'border-crust text-crust'
              : 'border-sage text-[color-mix(in_oklab,var(--sage)_80%,var(--ink))]'
          }`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
