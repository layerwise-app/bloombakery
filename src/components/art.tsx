// Original illustrations in a linocut style. Everything is drawn here as inline
// SVG and colored from the palette in `business.config.ts`, so changing the
// brand colors recolors the bread too. Nothing is loaded from elsewhere.

import type { ReactNode, SVGProps } from 'react';
import { business } from '~/business.config';

const ink = 'var(--ink)';
const crust = 'var(--crust)';
const butter = 'var(--butter)';
const rye = 'var(--rye)';
const paper = 'var(--paper)';
const deep = 'var(--paper-deep)';
const sage = 'var(--sage)';
const gold = 'color-mix(in oklab, var(--butter) 62%, var(--crust))';
const toast = 'color-mix(in oklab, var(--crust) 62%, var(--rye))';
const cream = 'color-mix(in oklab, var(--paper) 62%, white)';
const plum = 'color-mix(in oklab, var(--crust) 45%, #4d1f3a)';

function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** A smooth closed shape, slightly uneven like a hand-cut block. */
function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed = 1,
  wobble = 0.025,
  count = 14
) {
  const next = random(seed);
  const points = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const scale = 1 + (next() - 0.5) * 2 * wobble;
    return [cx + Math.cos(angle) * rx * scale, cy + Math.sin(angle) * ry * scale];
  }) as [number, number][];
  let path = `M${round(points[0]![0])} ${round(points[0]![1])}`;
  for (let index = 0; index < count; index += 1) {
    const p0 = points[(index + count - 1) % count]!;
    const p1 = points[index]!;
    const p2 = points[(index + 1) % count]!;
    const p3 = points[(index + 2) % count]!;
    path += `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)} ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${path}Z`;
}

function spiral(cx: number, cy: number, turns: number, radius: number, start = 10) {
  const steps = Math.round(turns * 28);
  let path = '';
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const angle = t * turns * Math.PI * 2;
    const r = start + (radius - start) * t;
    path += `${index ? 'L' : 'M'}${round(cx + Math.cos(angle) * r)} ${round(cy + Math.sin(angle) * r)}`;
  }
  return path;
}

/** Scattered marks inside an ellipse: seeds, flour, and sugar. */
function Speckle({
  cx,
  cy,
  rx,
  ry,
  count,
  seed,
  fill,
  size = 4,
  long = 1.8
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  seed: number;
  fill: string;
  size?: number;
  long?: number;
}) {
  const next = random(seed);
  return (
    <g fill={fill}>
      {Array.from({ length: count }, (_, index) => {
        const angle = next() * Math.PI * 2;
        const distance = Math.sqrt(next());
        const x = round(cx + Math.cos(angle) * rx * distance);
        const y = round(cy + Math.sin(angle) * ry * distance);
        const scale = 0.7 + next() * 0.6;
        return (
          <ellipse
            key={index}
            cx={x}
            cy={y}
            rx={round(size * long * scale)}
            ry={round(size * scale)}
            transform={`rotate(${Math.round(next() * 180)} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}

function Shadow({ cx = 200, cy = 340, rx = 150, ry = 16 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={ink} opacity='0.14' />;
}

/** The house loaf from above: banneton flour rings and a leaf-shaped score. */
function BouleShape({ seed = 3 }: { seed?: number }) {
  return (
    <g>
      <path d={blob(200, 208, 164, 160, seed)} fill={rye} opacity='0.9' />
      <path d={blob(200, 202, 158, 154, seed + 1)} fill={toast} />
      <path d={blob(197, 197, 146, 142, seed + 2)} fill={crust} />
      <path d={blob(190, 188, 118, 112, seed + 3, 0.04)} fill={gold} />
      <g fill='none' stroke={cream} strokeLinecap='round'>
        <path d={blob(197, 198, 132, 128, seed + 4)} strokeWidth='4' strokeDasharray='30 7' opacity='0.6' />
        <path d={blob(197, 198, 110, 106, seed + 5)} strokeWidth='4' strokeDasharray='44 8' opacity='0.55' />
        <path d={blob(197, 198, 88, 84, seed + 6)} strokeWidth='4' strokeDasharray='26 9' opacity='0.55' />
        <path d={blob(197, 198, 64, 60, seed + 7)} strokeWidth='3.5' strokeDasharray='30 9' opacity='0.5' />
      </g>
      <Speckle cx={197} cy={198} rx={140} ry={136} count={70} seed={seed + 11} fill={cream} size={1.5} long={1.2} />
      <g transform='rotate(-38 200 200)'>
        <path d='M64 203C110 158 290 158 336 203C290 232 110 232 64 203Z' fill={rye} />
        <path d='M76 200C120 170 280 170 324 200C280 218 120 218 76 200Z' fill={butter} />
        <path d='M96 198C140 180 260 180 304 198' fill='none' stroke={cream} strokeWidth='5' strokeLinecap='round' opacity='0.8' />
        <path d='M130 210C170 216 230 216 270 210' fill='none' stroke={gold} strokeWidth='5' strokeLinecap='round' />
        {[-90, -45, 0, 45, 90].map((x) => (
          <g key={x}>
            <path d={`M${200 + x} 158l${x > 0 ? 12 : -12} -26`} stroke={crust} strokeWidth='6' strokeLinecap='round' />
            <path d={`M${200 + x} 240l${x > 0 ? 12 : -12} 24`} stroke={crust} strokeWidth='6' strokeLinecap='round' />
          </g>
        ))}
      </g>
    </g>
  );
}

function Boule() {
  return (
    <>
      <Shadow cy={364} rx={130} ry={12} />
      <BouleShape />
    </>
  );
}

function RyeLoaf() {
  return (
    <>
      <Shadow cy={330} rx={160} />
      <g transform='rotate(-16 200 200)'>
        <path d={blob(200, 206, 172, 100, 5)} fill={ink} />
        <path d={blob(200, 198, 164, 92, 6)} fill={rye} />
        <path d={blob(196, 186, 140, 62, 7, 0.04)} fill={toast} opacity='0.75' />
        {[-96, -32, 32, 96].map((x, index) => (
          <g key={x}>
            <path
              d={`M${200 + x - 14} 134C${200 + x + 20} 160 ${200 + x + 20} 230 ${200 + x - 6} 262`}
              fill='none'
              stroke={ink}
              strokeWidth='17'
              strokeLinecap='round'
            />
            <path
              d={`M${200 + x - 12} 140C${200 + x + 18} 166 ${200 + x + 18} 226 ${200 + x - 6} 256`}
              fill='none'
              stroke={index % 2 ? gold : butter}
              strokeWidth='7'
              strokeLinecap='round'
            />
          </g>
        ))}
        <Speckle cx={200} cy={196} rx={150} ry={80} count={58} seed={21} fill={butter} size={3.6} />
        <Speckle cx={200} cy={196} rx={150} ry={80} count={44} seed={44} fill={cream} size={3} />
        <Speckle cx={200} cy={196} rx={150} ry={80} count={36} seed={67} fill={ink} size={2.6} />
      </g>
    </>
  );
}

function PanLoaf() {
  return (
    <>
      <Shadow cy={342} rx={170} />
      <path d='M56 196C42 118 118 84 176 92C198 72 268 72 296 96C346 96 366 152 350 200L346 328C346 338 340 342 330 342L72 342C62 342 58 338 58 328Z' fill={toast} />
      <path d='M66 192C56 128 122 98 178 106C204 88 262 88 290 110C334 110 350 156 338 192C288 206 118 206 66 192Z' fill={crust} />
      <path d='M90 174C88 138 134 118 182 124C204 110 254 112 276 128C306 128 318 150 312 174C262 186 140 186 90 174Z' fill={gold} />
      <path d='M116 156C150 138 180 138 202 142M222 138C244 134 266 140 284 152' fill='none' stroke={butter} strokeWidth='8' strokeLinecap='round' />
      <path d='M72 206H330V330H72Z' fill={gold} />
      <path d='M86 214V322M118 214V322M150 214V322M182 214V322M214 214V322M246 214V322M278 214V322M310 214V322' stroke={toast} strokeWidth='3' opacity='0.42' />
      <path d='M40 214C40 174 92 168 112 182C138 172 170 186 170 216C170 226 164 234 160 240L160 332C160 340 156 344 148 344L52 344C44 344 40 340 40 332L40 246C42 236 40 224 40 214Z' fill={crust} />
      <path d='M50 216C50 190 92 182 110 194C130 186 158 196 158 218C158 228 150 234 150 244L150 326C150 332 148 334 142 334L58 334C52 334 50 332 50 326L50 246C50 236 50 226 50 216Z' fill={cream} />
      <Speckle cx={104} cy={258} rx={44} ry={66} count={34} seed={8} fill={gold} size={2.4} long={1.5} />
    </>
  );
}

function Baguette() {
  const cuts = [-128, -68, -8, 52, 112];
  return (
    <>
      <Shadow cy={340} rx={140} />
      <g transform='rotate(-36 200 200)'>
        <path d={blob(200, 212, 186, 60, 9, 0.025, 18)} fill={rye} />
        <path d={blob(200, 204, 178, 54, 10, 0.025, 18)} fill={crust} />
        <path d={blob(196, 192, 156, 32, 11, 0.04, 18)} fill={gold} />
        {cuts.map((x) => (
          <g key={x}>
            <path d={`M${200 + x} 168C${216 + x} 180 ${226 + x} 208 ${222 + x} 236`} fill='none' stroke={rye} strokeWidth='18' strokeLinecap='round' />
            <path d={`M${200 + x} 172C${214 + x} 184 ${222 + x} 208 ${220 + x} 230`} fill='none' stroke={butter} strokeWidth='9' strokeLinecap='round' />
          </g>
        ))}
        <Speckle cx={200} cy={200} rx={166} ry={40} count={46} seed={15} fill={cream} size={1.4} long={1.2} />
      </g>
    </>
  );
}

function Focaccia() {
  return (
    <>
      <Shadow cy={348} rx={160} />
      <g transform='rotate(-5 200 200)'>
        <rect x='38' y='66' width='324' height='276' rx='40' fill={toast} />
        <rect x='46' y='62' width='308' height='264' rx='36' fill={crust} />
        <path d={blob(200, 192, 136, 110, 17, 0.05)} fill={gold} />
        <Speckle cx={198} cy={190} rx={138} ry={110} count={16} seed={30} fill={crust} size={9} long={1.3} />
        {[
          [110, 130],
          [262, 110],
          [160, 240],
          [288, 232],
          [216, 170]
        ].map(([x = 0, y = 0]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r='17' fill={ink} />
            <circle cx={x - 2} cy={y - 2} r='13' fill={rye} />
            <circle cx={x} cy={y} r='5' fill={butter} />
          </g>
        ))}
        {[
          [84, 216, 36],
          [230, 84, -24],
          [278, 170, 60],
          [150, 118, -60]
        ].map(([x = 0, y = 0, r = 0]) => (
          <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`} stroke={sage} strokeLinecap='round'>
            <path d={`M${x} ${y}h66`} strokeWidth='4' />
            {[8, 20, 32, 44, 56].map((step) => (
              <path key={step} d={`M${x + step} ${y}l10 -12M${x + step} ${y}l10 12`} strokeWidth='4.5' />
            ))}
          </g>
        ))}
        <Speckle cx={200} cy={196} rx={150} ry={124} count={40} seed={52} fill={cream} size={2.6} long={1} />
      </g>
    </>
  );
}

/** A crescent of overlapping laminated folds. */
function CroissantShape() {
  const folds = [
    { x: 58, y: 244, rx: 44, ry: 26, r: -62, tone: crust },
    { x: 342, y: 244, rx: 44, ry: 26, r: 62, tone: crust },
    { x: 92, y: 190, rx: 58, ry: 44, r: -48, tone: gold },
    { x: 308, y: 190, rx: 58, ry: 44, r: 48, tone: gold },
    { x: 144, y: 148, rx: 62, ry: 62, r: -22, tone: crust },
    { x: 256, y: 148, rx: 62, ry: 62, r: 22, tone: crust },
    { x: 200, y: 136, rx: 62, ry: 76, r: 0, tone: gold }
  ];
  return (
    <g>
      <path d='M34 288C50 150 120 74 200 74C280 74 350 150 366 288C352 300 330 292 322 280C300 238 262 214 200 214C138 214 100 238 78 280C70 292 48 300 34 288Z' fill={rye} transform='translate(0 8)' />
      {folds.map((fold) => (
        <g key={`${fold.x}${fold.y}`} transform={`rotate(${fold.r} ${fold.x} ${fold.y})`}>
          <ellipse cx={fold.x} cy={fold.y} rx={fold.rx + 3} ry={fold.ry + 3} fill={toast} />
          <ellipse cx={fold.x} cy={fold.y} rx={fold.rx} ry={fold.ry} fill={fold.tone} />
          <ellipse cx={fold.x} cy={fold.y - fold.ry * 0.28} rx={fold.rx * 0.74} ry={fold.ry * 0.56} fill={butter} opacity='0.72' />
          {[-0.48, -0.16, 0.16, 0.48].map((step) => (
            <path
              key={step}
              d={`M${fold.x + fold.rx * step} ${fold.y - fold.ry * 0.86}Q${fold.x + fold.rx * step * 1.6} ${fold.y} ${fold.x + fold.rx * step} ${fold.y + fold.ry * 0.86}`}
              fill='none'
              stroke={toast}
              strokeWidth='3'
              opacity='0.62'
            />
          ))}
        </g>
      ))}
      <Speckle cx={200} cy={150} rx={130} ry={70} count={22} seed={27} fill={toast} size={2} long={2.4} />
    </g>
  );
}

function Croissant() {
  return (
    <>
      <Shadow cy={320} rx={170} />
      <g transform='translate(0 22)'>
        <CroissantShape />
      </g>
    </>
  );
}

function CinnamonRollShape() {
  return (
    <g>
      <path d={blob(200, 206, 158, 152, 18)} fill={rye} />
      <path d={blob(200, 200, 150, 146, 19)} fill={crust} />
      <path d={blob(196, 194, 132, 128, 20, 0.03)} fill={gold} />
      <path d={spiral(200, 198, 3.3, 138, 12)} fill='none' stroke={rye} strokeWidth='17' strokeLinecap='round' />
      <path d={spiral(200, 198, 3.3, 138, 12)} fill='none' stroke={toast} strokeWidth='10' strokeLinecap='round' />
      <path
        d='M92 118C140 92 172 150 118 174C76 196 132 238 170 204C208 168 244 110 280 142C318 176 242 204 214 238C190 268 250 300 296 262M78 238C110 274 142 296 188 300'
        fill='none'
        stroke={ink}
        strokeWidth='21'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.16'
        transform='translate(3 5)'
      />
      <path
        d='M92 118C140 92 172 150 118 174C76 196 132 238 170 204C208 168 244 110 280 142C318 176 242 204 214 238C190 268 250 300 296 262M78 238C110 274 142 296 188 300'
        fill='none'
        stroke={cream}
        strokeWidth='18'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
  );
}

function CinnamonRoll() {
  return (
    <>
      <Shadow cy={362} rx={132} ry={12} />
      <CinnamonRollShape />
    </>
  );
}

function PainAuChocolat() {
  return (
    <>
      <Shadow cy={326} rx={166} />
      <g transform='rotate(-8 200 200)'>
        <path d='M46 128C46 106 66 96 90 96L312 88C338 88 356 104 356 128L360 266C360 290 340 304 316 304L90 304C64 304 46 290 46 266Z' fill={rye} />
        <path d='M54 124C54 106 70 98 92 98L310 92C332 92 348 106 348 126L352 258C352 280 334 292 314 292L92 292C70 292 54 280 54 258Z' fill={crust} />
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={`M${92 + index * 68} 98C${72 + index * 68} 158 ${72 + index * 68} 232 ${92 + index * 68} 292`}
            fill='none'
            stroke={toast}
            strokeWidth='7'
          />
        ))}
        {[0, 1, 2].map((index) => (
          <path
            key={index}
            d={`M${112 + index * 68} 118C${98 + index * 68} 164 ${98 + index * 68} 226 ${112 + index * 68} 272L${140 + index * 68} 272C${126 + index * 68} 226 ${126 + index * 68} 164 ${140 + index * 68} 118Z`}
            fill={gold}
          />
        ))}
        <path d='M286 112L334 110C338 156 338 240 336 278L288 278C276 230 276 162 286 112Z' fill={gold} />
        <rect x='334' y='136' width='36' height='46' rx='6' fill={ink} />
        <rect x='334' y='206' width='36' height='46' rx='6' fill={ink} />
        <rect x='340' y='144' width='22' height='10' rx='3' fill={rye} />
        <rect x='340' y='214' width='22' height='10' rx='3' fill={rye} />
        <Speckle cx={190} cy={190} rx={130} ry={70} count={26} seed={33} fill={toast} size={2} long={2.2} />
      </g>
    </>
  );
}

function MorningBun() {
  return (
    <>
      <Shadow cy={362} rx={130} ry={12} />
      <path d={blob(200, 206, 156, 150, 24, 0.045)} fill={rye} />
      <path d={blob(200, 198, 148, 144, 25, 0.045)} fill={toast} />
      <path d={blob(196, 192, 128, 124, 26, 0.05)} fill={crust} />
      <path d={spiral(200, 196, 2.8, 132, 14)} fill='none' stroke={rye} strokeWidth='12' strokeLinecap='round' opacity='0.8' />
      <path d={spiral(204, 192, 2.8, 124, 14)} fill='none' stroke={butter} strokeWidth='10' strokeLinecap='round' opacity='0.9' />
      <Speckle cx={198} cy={194} rx={126} ry={122} count={160} seed={36} fill={cream} size={1.5} long={1.1} />
      {[
        [136, 136, 20],
        [252, 124, -40],
        [288, 218, 70],
        [122, 240, -20],
        [206, 276, 15],
        [200, 176, 110]
      ].map(([x = 0, y = 0, r = 0]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx='27' ry='13' fill={toast} />
          <ellipse cx={x - 1} cy={y - 1} rx='23' ry='9.5' fill={cream} />
          <path d={`M${x - 16} ${y - 1}h30`} stroke={deep} strokeWidth='2' />
        </g>
      ))}
    </>
  );
}

function Danish() {
  return (
    <>
      <Shadow cy={360} rx={132} ry={12} />
      <g transform='rotate(45 200 200)'>
        <rect x='78' y='82' width='252' height='252' rx='28' fill={rye} />
        <rect x='74' y='74' width='252' height='252' rx='26' fill={crust} />
        <rect x='92' y='92' width='216' height='216' rx='20' fill={gold} />
      </g>
      <g fill={crust}>
        <path d='M200 42L240 92L160 92Z' />
        <path d='M200 358L240 308L160 308Z' />
        <path d='M42 200L92 240L92 160Z' />
        <path d='M358 200L308 240L308 160Z' />
      </g>
      <path d={blob(200, 200, 112, 108, 39)} fill={toast} />
      <path d={blob(200, 198, 102, 98, 40)} fill={butter} />
      <path d={blob(200, 198, 86, 82, 41)} fill={cream} />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 200 198)`}>
          <path d='M200 196C168 180 164 138 200 118C236 138 232 180 200 196Z' fill={plum} />
          <path d='M200 182C184 170 182 144 200 130C206 150 206 166 200 182Z' fill={crust} />
        </g>
      ))}
      <circle cx='200' cy='198' r='14' fill={butter} />
    </>
  );
}

function Cookie() {
  return (
    <>
      <Shadow cy={350} rx={132} ry={12} />
      <path d={blob(200, 202, 152, 146, 42, 0.05)} fill={ink} />
      <path d={blob(198, 196, 144, 138, 43, 0.05)} fill={rye} />
      <g fill={ink} opacity='0.82'>
        <path d='M110 104L164 130L150 164L188 186L142 222L88 186Z' opacity='0.5' />
        <path d='M226 92L272 108L300 168L256 182L218 146Z' opacity='0.5' />
        <path d='M170 238L232 212L278 244L256 300L190 310Z' opacity='0.5' />
      </g>
      <path
        d='M92 180L146 170L162 124M162 170L204 192L214 136M204 192L188 240L134 268M188 240L256 224L306 184M256 224L272 286'
        fill='none'
        stroke={toast}
        strokeWidth='5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Speckle cx={198} cy={196} rx={120} ry={116} count={30} seed={45} fill={cream} size={4.6} long={1.1} />
    </>
  );
}

function CupFromAbove({
  coffee,
  rim,
  children
}: {
  coffee: string;
  rim: string;
  children?: ReactNode;
}) {
  return (
    <>
      <path d={blob(200, 208, 174, 170, 47)} fill={ink} opacity='0.14' />
      <path d={blob(200, 200, 174, 170, 48)} fill={deep} />
      <path d={blob(200, 200, 160, 156, 49)} fill={cream} />
      <rect x='320' y='180' width='66' height='38' rx='17' fill={rim} />
      <path d={blob(200, 200, 118, 116, 50)} fill={rim} />
      <path d={blob(200, 200, 106, 104, 51)} fill={coffee} />
      {children}
    </>
  );
}

function Drip() {
  return (
    <CupFromAbove coffee={rye} rim={crust}>
      <path d='M118 170C136 124 182 102 226 110' fill='none' stroke={toast} strokeWidth='11' strokeLinecap='round' />
      <path d='M134 202C142 170 162 152 186 144' fill='none' stroke={crust} strokeWidth='6' strokeLinecap='round' opacity='0.7' />
      <Speckle cx={200} cy={200} rx={82} ry={80} count={16} seed={55} fill={toast} size={2} long={1} />
    </CupFromAbove>
  );
}

function Latte() {
  const leaves = [146, 170, 194, 218, 242];
  return (
    <CupFromAbove coffee={toast} rim={rye}>
      {leaves.map((y, index) => {
        const spread = 72 - Math.abs(index - 1) * 11;
        return (
          <path
            key={y}
            d={`M${200 - spread} ${y - 16}C${200 - spread * 0.5} ${y + 14} ${200 + spread * 0.5} ${y + 14} ${200 + spread} ${y - 16}C${200 + spread * 0.5} ${y + 34} ${200 - spread * 0.5} ${y + 34} ${200 - spread} ${y - 16}Z`}
            fill={cream}
          />
        );
      })}
      <path d='M200 126V292' stroke={cream} strokeWidth='7' strokeLinecap='round' />
      <circle cx='200' cy='128' r='13' fill={cream} />
    </CupFromAbove>
  );
}

function Cortado() {
  return (
    <>
      <Shadow cy={338} rx={120} />
      <path d={blob(200, 332, 136, 15, 52, 0.02)} fill={deep} />
      <path d='M116 86L284 86L262 324C261 332 256 336 248 336L152 336C144 336 139 332 138 324Z' fill={cream} />
      <path d='M136 104L264 104L256 186L144 186Z' fill={cream} />
      <path d='M138 136L262 136L256 200L144 200Z' fill={butter} />
      <path d='M143 190L257 190L247 318L153 318Z' fill={rye} />
      <path d='M143 190C168 214 180 180 200 198C222 216 234 182 257 190L255 212C232 222 222 200 200 214C180 226 164 208 145 214Z' fill={gold} />
      <path d='M116 86L284 86L262 324C261 332 256 336 248 336L152 336C144 336 139 332 138 324Z' fill='none' stroke={ink} strokeWidth='5' strokeLinejoin='round' />
      <path d='M156 118L168 300' stroke={cream} strokeWidth='7' strokeLinecap='round' opacity='0.6' />
      <path d='M116 86H284' stroke={ink} strokeWidth='7' strokeLinecap='round' />
    </>
  );
}

function ColdBrew() {
  return (
    <>
      <Shadow cy={362} rx={100} ry={12} />
      <path d='M248 96L286 22' stroke={crust} strokeWidth='14' strokeLinecap='round' />
      <path d='M248 96L286 22' stroke={butter} strokeWidth='5' strokeLinecap='round' strokeDasharray='10 12' />
      <path d='M116 58L284 58L262 350C261 358 255 362 248 362L152 362C145 362 139 358 138 350Z' fill={cream} />
      <path d='M124 110L276 110L259 342C258 350 254 352 248 352L152 352C146 352 142 350 141 342Z' fill={rye} />
      <path d='M124 110C164 124 232 96 276 110L274 134C232 122 166 146 126 132Z' fill={toast} />
      {[
        [170, 170, 18],
        [226, 168, -14],
        [196, 226, 36],
        [168, 280, -20],
        [226, 276, 24]
      ].map(([x = 0, y = 0, r = 0]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 25} y={y - 25} width='50' height='50' rx='9' fill={cream} opacity='0.3' />
          <path d={`M${x - 15} ${y - 13}h24`} stroke={cream} strokeWidth='6' strokeLinecap='round' opacity='0.72' />
        </g>
      ))}
      <path d='M116 58L284 58L262 350C261 358 255 362 248 362L152 362C145 362 139 358 138 350Z' fill='none' stroke={ink} strokeWidth='5' strokeLinejoin='round' />
      <path d='M116 58H284' stroke={ink} strokeWidth='7' strokeLinecap='round' />
    </>
  );
}

function Chai() {
  return (
    <>
      <Shadow cy={346} rx={150} />
      <path d='M124 62C104 42 144 28 124 8M180 62C160 42 200 28 180 8M236 62C216 42 256 28 236 8' fill='none' stroke={crust} strokeWidth='8' strokeLinecap='round' opacity='0.68' transform='translate(-16 12)' />
      <path d='M282 150H318C350 150 354 266 318 268H274' fill='none' stroke={ink} strokeWidth='28' strokeLinecap='round' />
      <path d='M282 150H318C350 150 354 266 318 268H274' fill='none' stroke={crust} strokeWidth='18' strokeLinecap='round' />
      <path d='M58 94H294V284C294 318 274 340 240 340H112C78 340 58 318 58 284Z' fill={ink} />
      <path d='M66 96H286V280C286 312 268 330 238 330H114C84 330 66 312 66 280Z' fill={crust} />
      <path d='M66 96H118V330C84 324 66 312 66 280Z' fill={toast} opacity='0.5' />
      <path d={blob(176, 96, 118, 22, 58, 0.015)} fill={ink} />
      <path d={blob(176, 96, 106, 15, 59, 0.015)} fill={gold} />
      <path d='M110 180L236 180M110 212L236 212M110 244L236 244' stroke={butter} strokeWidth='7' strokeDasharray='2 16' strokeLinecap='round' opacity='0.92' />
      <g transform='translate(314 330)'>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path key={angle} d='M0 0C-10 -12 -7 -30 0 -38C7 -30 10 -12 0 0Z' fill={rye} transform={`rotate(${angle})`} />
        ))}
        <circle r='6' fill={butter} />
      </g>
    </>
  );
}

function Box() {
  return (
    <>
      <ellipse cx='400' cy='560' rx='344' ry='26' fill={ink} opacity='0.26' />
      <g transform='translate(90 92) scale(0.95)'>
        <path d='M36 120L102 42H498L564 120Z' fill={toast} />
      </g>
      <g transform='translate(160 56) scale(0.92)'>
        <BouleShape seed={8} />
      </g>
      <g transform='translate(392 120) scale(0.8) rotate(-12 200 200)'>
        <CroissantShape />
      </g>
      <g transform='translate(92 176) scale(0.64)'>
        <CinnamonRollShape />
      </g>
      <path d='M104 262H696L664 544C663 554 654 560 644 560H156C146 560 137 554 136 544Z' fill={gold} />
      <path d='M104 262H696L690 318H110Z' fill={butter} />
      <path d='M104 262H696L690 318H110Z' fill='none' stroke={toast} strokeWidth='4' />
      <path d='M394 262H406V560H394Z' fill={cream} />
      <path d='M112 396H688' stroke={cream} strokeWidth='11' />
      <path d='M104 262L74 208L276 208L320 262Z' fill={butter} />
      <path d='M696 262L726 208L524 208L480 262Z' fill={butter} />
      <path d='M104 262L74 208L276 208L320 262ZM696 262L726 208L524 208L480 262Z' fill='none' stroke={toast} strokeWidth='4' strokeLinejoin='round' />
      <g transform='rotate(-3 400 420)'>
        <rect x='256' y='346' width='288' height='124' fill={cream} />
        <rect x='266' y='356' width='268' height='104' fill='none' stroke={ink} strokeWidth='3' />
        <text x='400' y='404' textAnchor='middle' fontFamily='var(--font-heading)' fontSize='38' fontWeight='600' fill={ink}>
          {business.name}
        </text>
        <text x='400' y='438' textAnchor='middle' fontFamily='var(--font-mono)' fontSize='17' letterSpacing='3' fill={crust}>
          THE WEEKEND BOX
        </text>
      </g>
    </>
  );
}

function Hero() {
  const rays = [-78, -60, -42, -24, -6, 12, 30, 48, 66, 84];
  return (
    <>
      <rect width='800' height='1000' fill={butter} />
      <g fill={gold} opacity='0.9'>
        {rays.map((angle) => (
          <path key={angle} d='M400 610L-62 -340L92 -340Z' transform={`rotate(${angle} 400 610)`} opacity='0.82' />
        ))}
      </g>
      <circle cx='400' cy='610' r='336' fill={crust} opacity='0.32' />
      <circle cx='400' cy='610' r='276' fill={gold} />
      <circle cx='400' cy='610' r='214' fill={butter} />
      <circle cx='400' cy='610' r='150' fill={cream} />
      <g fill={toast}>
        <path d='M0 640V580L58 546L110 584V520L176 472L238 520V592L296 562L342 596L342 640Z' />
        <path d='M800 640V566L740 528L690 566V504L642 468L588 506V586L530 554L470 600L470 640Z' />
        <rect x='300' y='580' width='210' height='70' />
      </g>
      <g fill={butter}>
        {[
          [136, 548],
          [192, 530],
          [136, 590],
          [650, 542],
          [612, 580],
          [706, 590]
        ].map(([x = 0, y = 0]) => (
          <rect key={`${x}${y}`} x={x} y={y} width='18' height='28' />
        ))}
      </g>
      <path d='M0 642C160 620 280 638 400 636C530 632 660 618 800 638V1000H0Z' fill={rye} />
      <g fill='none' stroke={toast} strokeWidth='5' strokeLinecap='round' opacity='0.72'>
        <path d='M0 712C160 690 300 706 470 698S700 690 800 704' />
        <path d='M0 808C110 792 240 806 410 794S690 790 800 802' />
        <path d='M0 910C160 892 280 910 450 900S710 894 800 906' />
      </g>
      <g fill='none' stroke={cream} strokeWidth='12' strokeLinecap='round' opacity='0.85'>
        <path d='M316 420C276 370 354 326 314 268' />
        <path d='M410 390C370 330 450 280 408 214' />
        <path d='M504 420C464 370 542 326 502 268' />
      </g>
      <ellipse cx='400' cy='870' rx='300' ry='34' fill={ink} opacity='0.34' />
      <g transform='translate(120 440) scale(1.4)'>
        <BouleShape />
      </g>
      <g transform='translate(12 766) scale(0.72) rotate(-14 200 200)'>
        <CroissantShape />
      </g>
      <g transform='translate(556 774) scale(0.56)'>
        <CinnamonRollShape />
      </g>
    </>
  );
}

const artwork = {
  boule: { viewBox: '0 0 400 400', Art: Boule },
  rye: { viewBox: '0 0 400 400', Art: RyeLoaf },
  panloaf: { viewBox: '0 0 400 400', Art: PanLoaf },
  baguette: { viewBox: '0 0 400 400', Art: Baguette },
  focaccia: { viewBox: '0 0 400 400', Art: Focaccia },
  croissant: { viewBox: '0 0 400 400', Art: Croissant },
  cinnamonroll: { viewBox: '0 0 400 400', Art: CinnamonRoll },
  painauchocolat: { viewBox: '0 0 400 400', Art: PainAuChocolat },
  morningbun: { viewBox: '0 0 400 400', Art: MorningBun },
  danish: { viewBox: '0 0 400 400', Art: Danish },
  cookie: { viewBox: '0 0 400 400', Art: Cookie },
  drip: { viewBox: '0 0 400 400', Art: Drip },
  latte: { viewBox: '0 0 400 400', Art: Latte },
  cortado: { viewBox: '0 0 400 400', Art: Cortado },
  coldbrew: { viewBox: '0 0 400 400', Art: ColdBrew },
  chai: { viewBox: '0 0 400 400', Art: Chai },
  box: { viewBox: '0 0 800 600', Art: Box },
  hero: { viewBox: '0 0 800 1000', Art: Hero }
} as const;

export type ArtName = keyof typeof artwork;

/** The illustrations an owner can pick for a menu item. */
export const menuArtOptions: { value: ArtName; label: string }[] = [
  { value: 'boule', label: 'Round loaf' },
  { value: 'rye', label: 'Seeded loaf' },
  { value: 'panloaf', label: 'Pan loaf' },
  { value: 'baguette', label: 'Baguette' },
  { value: 'focaccia', label: 'Focaccia' },
  { value: 'croissant', label: 'Croissant' },
  { value: 'cinnamonroll', label: 'Cinnamon roll' },
  { value: 'painauchocolat', label: 'Pain au chocolat' },
  { value: 'morningbun', label: 'Morning bun' },
  { value: 'danish', label: 'Danish' },
  { value: 'cookie', label: 'Cookie' },
  { value: 'drip', label: 'Black coffee' },
  { value: 'latte', label: 'Latte' },
  { value: 'cortado', label: 'Cortado' },
  { value: 'coldbrew', label: 'Iced coffee' },
  { value: 'chai', label: 'Mug' }
];

export function Art({
  name,
  label,
  ...props
}: { name: string; label?: string } & SVGProps<SVGSVGElement>) {
  const { viewBox, Art: Drawing } =
    artwork[name as ArtName] ?? artwork.boule;
  return (
    <svg
      viewBox={viewBox}
      xmlns='http://www.w3.org/2000/svg'
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    >
      <Drawing />
    </svg>
  );
}

/** The logo: a round loaf with a single curved score. */
export function BloomMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 64 64' aria-hidden='true' {...props}>
      <circle cx='32' cy='32' r='30' fill='currentColor' />
      <path d='M15 45C20 25 33 16 49 15C47 33 37 44 15 45Z' fill='var(--paper)' />
      <path d='M21 40C28 33 35 26 43 21' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
      <path d='M27 34L24 26M34 28L32 21M28 34L37 36M35 27L44 28' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' />
    </svg>
  );
}

/** A small flourish that separates sections. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 120 24' aria-hidden='true' className={className} fill='none' stroke='currentColor' strokeLinecap='round'>
      <path d='M4 12H116' strokeWidth='1.5' />
      {[40, 50, 60, 70, 80].map((x) => (
        <path key={x} d={`M${x} 12l6 -7M${x} 12l6 7`} strokeWidth='2' />
      ))}
    </svg>
  );
}
