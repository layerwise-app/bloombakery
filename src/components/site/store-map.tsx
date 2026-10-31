import { business, fullAddress } from '~/business.config';

/** A simple drawn street map. It's a static graphic, not a live map. */
export function StoreMap({ className = '' }: { className?: string }) {
  const { main, cross, park } = business.contact.mapLabels;
  const block = 'color-mix(in oklab, var(--paper-deep) 80%, var(--crust) 8%)';
  const road = 'var(--paper)';
  return (
    <svg
      viewBox='0 0 800 560'
      role='img'
      aria-label={`Street map showing ${business.name} at ${fullAddress()}, on the corner of ${main} and ${cross}, across from ${park}.`}
      className={className}
    >
      <rect width='800' height='560' fill={block} />
      <path d='M520 -10C500 120 640 190 620 300S500 460 540 570H820V-10Z' fill='color-mix(in oklab, var(--sage) 55%, var(--paper))' />
      <g fill='none' stroke='color-mix(in oklab, var(--sage) 85%, var(--ink))' strokeWidth='3' strokeLinecap='round' opacity='0.7'>
        {[
          [664, 72],
          [716, 136],
          [660, 200],
          [738, 268],
          [700, 400],
          [622, 420],
          [730, 462],
          [650, 510]
        ].map(([x = 0, y = 0]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r='17' fill='color-mix(in oklab, var(--sage) 78%, var(--ink))' stroke='none' />
            <path d={`M${x} ${y + 17}v9`} />
          </g>
        ))}
      </g>
      <g stroke={road} strokeLinecap='square' fill='none'>
        <path d='M-10 306L830 248' strokeWidth='46' />
        <path d='M332 -10L388 570' strokeWidth='38' />
        <path d='M122 -10L168 570' strokeWidth='24' />
        <path d='M-10 104L560 66' strokeWidth='24' />
        <path d='M-10 478L540 448' strokeWidth='24' />
        <path d='M578 -10C556 120 690 190 668 300S556 460 590 570' strokeWidth='9' strokeDasharray='4 13' />
      </g>
      <path d='M-10 306L830 248' stroke='var(--crust)' strokeWidth='2.5' strokeDasharray='16 16' opacity='0.5' />
      <g fill='color-mix(in oklab, var(--rye) 18%, var(--paper-deep))' stroke='var(--rye)' strokeOpacity='0.28'>
        {[
          [186, 128, 60, 54],
          [262, 118, 40, 76],
          [18, 134, 80, 62],
          [196, 340, 80, 58],
          [20, 340, 92, 58],
          [420, 112, 86, 58],
          [424, 312, 82, 64],
          [422, 400, 54, 30],
          [20, 508, 100, 40],
          [200, 492, 100, 60]
        ].map(([x = 0, y = 0, w = 0, h = 0]) => (
          <rect key={`${x}${y}`} x={x} y={y} width={w} height={h} rx='2' />
        ))}
      </g>
      <g fontFamily='var(--font-mono)' fontWeight='500' fill='var(--rye)' fontSize='17' letterSpacing='2.5'>
        <text transform='translate(28 298) rotate(-4)'>{main.toUpperCase()}</text>
        <text transform='translate(370 322) rotate(84)'>{cross.toUpperCase()}</text>
      </g>
      <text x='726' y='334' textAnchor='middle' fontFamily='var(--font-display)' fontSize='24' fontStyle='italic' fill='var(--paper)'>
        {park}
      </text>
      <g transform='translate(282 286)' fontFamily='var(--font-mono)'>
        <circle r='14' fill='var(--ink)' />
        <text y='5' textAnchor='middle' fill='var(--paper)' fontSize='13'>12</text>
      </g>
      <g transform='translate(380 278)'>
        <ellipse cx='2' cy='6' rx='26' ry='8' fill='var(--ink)' opacity='0.3' />
        <path d='M0 4C-40 -42 -52 -66 -52 -92A52 52 0 0 1 52 -92C52 -66 40 -42 0 4Z' fill='var(--crust)' stroke='var(--ink)' strokeWidth='3.5' />
        <circle cx='0' cy='-92' r='31' fill='var(--paper)' />
        <path d='M-18 -78C-14 -96 -3 -106 18 -108C17 -91 7 -79 -18 -78Z' fill='var(--crust)' />
      </g>
      <g transform='translate(420 212)'>
        <rect x='0' y='-30' width='158' height='44' fill='var(--ink)' />
        <text x='79' y='0' textAnchor='middle' fill='var(--paper)' fontFamily='var(--font-display)' fontWeight='600' fontSize='23'>
          {business.name}
        </text>
      </g>
      <g transform='translate(60 60)' fill='none' stroke='var(--ink)' strokeWidth='2.5'>
        <circle r='26' fill='var(--paper)' />
        <path d='M0 -18L7 0L0 18L-7 0Z' fill='var(--crust)' stroke='none' />
        <text y='-32' textAnchor='middle' fontFamily='var(--font-mono)' fontSize='15' fill='var(--ink)' stroke='none'>N</text>
      </g>
    </svg>
  );
}
