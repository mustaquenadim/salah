/**
 * Geometry for the tasbih bead strand.
 *
 * The strand is a single cubic Bezier that enters off the left edge and leaves
 * off the right, rising as it goes -- a length of thread lying across the
 * screen rather than a closed ring. Running it past both edges is what makes it
 * read as endless: beads recycle out of sight instead of appearing from nowhere.
 *
 * Pure math, deliberately free of React and of `react-native-svg`, so the
 * curve can be reasoned about (and logged) on its own.
 */

export type Point = { x: number; y: number };

export type StrandControlPoints = {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
};

/**
 * How far past each edge the curve runs, in points.
 *
 * At least one bead diameter, or a bead would finish its fade while still
 * inside the viewport and visibly wink out.
 */
const OVERHANG = 80;

/**
 * The curve, as a fraction of the container.
 *
 * A shallow S rising left to right: near-flat at both ends where the beads
 * cluster, steepest in the middle where the bare cord shows. Tunable -- nothing
 * downstream assumes anything about these numbers beyond the curve being a
 * function of x.
 */
export function strandControlPoints(width: number, height: number): StrandControlPoints {
  return {
    p0: { x: -OVERHANG, y: height * 0.86 },
    // Both handles are pulled well off the chord between p0 and p3 -- p1 below
    // it, p2 above -- and held near the middle horizontally. Placed any closer
    // to the chord the cubic flattens into a plain diagonal, which is what a
    // strand pulled taut looks like rather than one lying slack.
    p1: { x: width * 0.26, y: height * 1.06 },
    p2: { x: width * 0.74, y: height * -0.02 },
    p3: { x: width + OVERHANG, y: height * 0.2 },
  };
}

function cubicAt(cp: StrandControlPoints, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * cp.p0.x + b * cp.p1.x + c * cp.p2.x + d * cp.p3.x,
    y: a * cp.p0.y + b * cp.p1.y + c * cp.p2.y + d * cp.p3.y,
  };
}

/** The `d` attribute for the cord, drawn under the beads. */
export function strandPathD(width: number, height: number): string {
  const { p0, p1, p2, p3 } = strandControlPoints(width, height);
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

export type StrandLut = {
  xs: number[];
  ys: number[];
  /** Cumulative arc length at each sample. Monotonically increasing. */
  ss: number[];
  /** Total arc length of the curve. */
  total: number;
};

/**
 * Samples the curve into an arc-length lookup table.
 *
 * Beads have to be spaced evenly along the *curve*, not along `t`. A cubic's
 * parameter advances fastest where the curve is straightest, so stepping `t`
 * uniformly bunches beads at the bends and stretches them along the middle --
 * which on a strand of identical spheres is immediately obvious as wrong.
 *
 * Plain arrays rather than `Float32Array`: these are captured by the bead
 * worklets, and typed arrays do not survive the trip to the UI runtime.
 */
export function buildStrandLut(width: number, height: number, samples = 240): StrandLut {
  const cp = strandControlPoints(width, height);
  const xs: number[] = [];
  const ys: number[] = [];
  const ss: number[] = [];

  let previous = cubicAt(cp, 0);
  let length = 0;

  xs.push(previous.x);
  ys.push(previous.y);
  ss.push(0);

  for (let i = 1; i <= samples; i++) {
    const point = cubicAt(cp, i / samples);
    // Chord length. With 240 samples the error against true arc length is far
    // below a pixel, and the beads only need to look evenly spaced.
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    xs.push(point.x);
    ys.push(point.y);
    ss.push(length);
    previous = point;
  }

  return { xs, ys, ss, total: length };
}

/**
 * Position at arc length `s` along the curve.
 *
 * A worklet: every bead calls this on the UI thread on every frame, so it must
 * not hop to JS. Binary search plus a linear interpolation between neighbours.
 */
export function sampleStrand(lut: StrandLut, s: number): Point {
  'worklet';
  const { xs, ys, ss } = lut;
  const last = ss.length - 1;

  if (s <= 0) return { x: xs[0], y: ys[0] };
  if (s >= ss[last]) return { x: xs[last], y: ys[last] };

  let low = 0;
  let high = last;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (ss[mid] <= s) low = mid;
    else high = mid;
  }

  const span = ss[high] - ss[low];
  const t = span > 0 ? (s - ss[low]) / span : 0;

  return {
    x: xs[low] + (xs[high] - xs[low]) * t,
    y: ys[low] + (ys[high] - ys[low]) * t,
  };
}
