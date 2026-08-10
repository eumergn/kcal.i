import Svg, { Rect } from 'react-native-svg';

/**
 * The brand mark's dumbbell - traced (pixel-measured) from kcal.i-intro.mp4's own
 * logo frame, not a stock glyph: four tapering plates per side around a center bar.
 * One shared component so every place the "Kcal.i" wordmark appears (header,
 * sign-in/sign-up, app icon) draws the identical shape instead of drifting between a
 * hand-drawn approximation and a FontAwesome glyph that looks subtly different.
 */
const PLATES = [
  { w: 9, h: 19, rx: 4.5 },
  { w: 11, h: 66, rx: 5.5 },
  { w: 12, h: 84, rx: 6 },
  { w: 15, h: 99, rx: 7.5 },
];
const BAR = { w: 106, h: 18, rx: 6 };
const GAP = 6;
const VIEW_HEIGHT = 104;
const CENTER_Y = VIEW_HEIGHT / 2;

function buildBars(): { x: number; y: number; w: number; h: number; rx: number }[] {
  const bars: { x: number; y: number; w: number; h: number; rx: number }[] = [];
  let x = 0;
  const place = (w: number, h: number, rx: number) => {
    bars.push({ x, y: CENTER_Y - h / 2, w, h, rx });
    x += w + GAP;
  };
  for (const p of PLATES) place(p.w, p.h, p.rx);
  place(BAR.w, BAR.h, BAR.rx);
  for (const p of [...PLATES].reverse()) place(p.w, p.h, p.rx);
  return bars;
}

const BARS = buildBars();
const VIEW_WIDTH = BARS[BARS.length - 1].x + BARS[BARS.length - 1].w;

export function DumbbellIcon({ size, color }: { size: number; color: string }) {
  const width = size * (VIEW_WIDTH / VIEW_HEIGHT);
  return (
    <Svg width={width} height={size} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
      {BARS.map((b, i) => (
        <Rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} fill={color} />
      ))}
    </Svg>
  );
}
