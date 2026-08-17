/**
 * Qibla geometry: the bearing to the Kaaba, and the angle maths the compass
 * needs to render it without tearing at the 0°/360° seam.
 *
 * Pure module -- no React, no React Native. Everything here is a function of
 * its arguments so the awkward parts (angle wrapping, circular smoothing) can
 * be reasoned about, and checked, in isolation.
 */

import { Coordinates, Qibla } from 'adhan';

import { distanceKm } from '@/lib/cities';

export type Coords = { latitude: number; longitude: number };

/**
 * The Kaaba, as an explicit literal rather than `CITIES.find(c => c.id === 'sa-makkah')`.
 *
 * The city list is user-facing picker copy with no stability contract, and
 * `find` returns `City | undefined`, so a fallback literal would be needed
 * regardless. The deciding reason is subtler: the city entry is 21.4225,
 * 39.8262 while adhan's internal constant is 21.4225241, 39.8261818. Reading
 * the bearing from one and the distance from the other would have the screen
 * quietly pointing at two different Kaabas. These are adhan's exact figures, so
 * the two agree by construction.
 */
export const KAABA: Coords = { latitude: 21.4225241, longitude: 39.8261818 };

/** Degrees within which the compass reads as "facing the Qibla". */
export const ALIGN_ENTER_DEG = 3;
/** Wider band the alignment must leave before it is dropped -- see below. */
export const ALIGN_EXIT_DEG = 6;

/**
 * Tilt from horizontal below which the phone counts as lying flat. Two values,
 * so the posture has to cross a wider band to be dropped than to be entered.
 */
export const FLAT_ENTER_DEG = 25;
export const FLAT_EXIT_DEG = 35;

/**
 * Bearing to the Kaaba in degrees clockwise from **true** north.
 *
 * `adhan` already ships this (and the app already depends on it for prayer
 * times), so there is no reason to hand-roll the spherical formula.
 */
export function qiblaBearing(coords: Coords): number {
  return Qibla(new Coordinates(coords.latitude, coords.longitude));
}

/** Great-circle distance to the Kaaba in kilometres. */
export function qiblaDistanceKm(coords: Coords): number {
  return distanceKm(coords, KAABA);
}

/**
 * Folds any angle into the signed range (-180, 180].
 *
 * This is the primitive the rest of the file is built on: it turns "the
 * difference between two compass bearings" into "how far, and which way, is
 * the short way round".
 */
export function normalizeSignedDegrees(degrees: number): number {
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

/**
 * Returns the value congruent to `target` modulo 360 nearest to
 * `previousContinuous`.
 *
 * The compass's single most likely bug lives here. Heading is reported in
 * [0, 360), so animating a dial straight from it steps 359 -> 0 and the spring
 * dutifully sweeps 359° backwards. The fix is to never hand the animation a
 * bounded angle at all: the dial holds an *unbounded* accumulator that only
 * ever moves by the shortest congruent step, so crossing the seam is a 1°
 * move like any other.
 *
 * Do not add periodic re-basing to keep the number small -- float64 is exact
 * far past the ±36,000° a hundred full turns would reach, and re-basing shows
 * up as a visible spin.
 *
 * @example
 * unwrapDegrees(1, 359) // 361, i.e. +2 rather than -358
 * unwrapDegrees(359, 1) // -1
 */
export function unwrapDegrees(target: number, previousContinuous: number): number {
  return previousContinuous + normalizeSignedDegrees(target - previousContinuous);
}

/**
 * Exponential moving average over the circle, returning [0, 360).
 *
 * A plain `previous * (1 - a) + next * a` averages 359° and 1° to 180° -- the
 * needle would jump to due south every time the user crossed north. Stepping
 * along the *signed* difference instead is what makes this a circular mean.
 *
 * @param alpha Weight of the new sample, 0-1. Higher is more responsive and
 *   noisier.
 */
export function smoothHeading(previous: number | null, next: number, alpha: number): number {
  if (previous == null) return next;
  const stepped = previous + normalizeSignedDegrees(next - previous) * alpha;
  return ((stepped % 360) + 360) % 360;
}

/**
 * Point on a circle at a compass bearing, in SVG coordinates.
 *
 * The -90 rotation puts bearing 0 at 12 o'clock; SVG's y-axis points down, so
 * (cos, sin) from there runs clockwise, which is the direction bearings
 * increase. Bearing 0 -> straight up, bearing 90 -> right.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  bearingDegrees: number
): { x: number; y: number } {
  const radians = ((bearingDegrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

/**
 * Signed angle from the device's facing direction to the Qibla, in (-180, 180].
 *
 * Positive means the Qibla is to the right. Because the dial is rotated by
 * `-heading` and the Kaaba glyph is drawn at `bearing` in the dial's own
 * frame, this is *literally* the glyph's offset from the fixed marker at the
 * top -- so one number drives the lock-on test, the turn left/right hint, the
 * dial highlight and the AR marker's horizontal position.
 */
export function alignmentErrorDegrees(bearing: number, heading: number): number {
  return normalizeSignedDegrees(bearing - heading);
}

/**
 * Angle between the device's screen normal and vertical, in degrees: ~0 when
 * the phone lies flat on a table, ~90 when it is held upright.
 *
 * Derived from the gravity vector as a *ratio* rather than from
 * `DeviceMotion`'s `rotation.beta`, deliberately. The SDK 56 docs describe
 * `rotation` as degrees while expo-sensors has historically emitted radians on
 * native, and there is a parallel m/s²-versus-g question on the acceleration
 * fields. A normalized ratio is immune to both, and `Math.abs` on z drops the
 * face-up/face-down sign convention. Do not "simplify" this back to
 * `rotation.beta`.
 *
 * @returns null for a degenerate sample (free fall, or a zeroed reading).
 */
export function tiltFromFlatDegrees(gravity: { x: number; y: number; z: number }): number | null {
  const magnitude = Math.hypot(gravity.x, gravity.y, gravity.z);
  if (magnitude < 1e-6) return null;
  return (Math.acos(Math.min(1, Math.abs(gravity.z) / magnitude)) * 180) / Math.PI;
}

/** `118°` -- the bearing as a whole number, for the readout. */
export function formatBearing(degrees: number): string {
  return `${Math.round(((degrees % 360) + 360) % 360)}°`;
}

/**
 * Distance in kilometres, thinned out as it grows: nobody needs metre
 * precision on a 4,000 km line, and the extra digits only make the number
 * harder to read at a glance.
 *
 * Grouped by hand rather than with `toLocaleString`, for the reason given at
 * the top of `date-format.ts`: Hermes has no ECMA-402 of its own and hands
 * `toLocale*` to `android.icu` or `NSDateFormatter`, so the two platforms can
 * quietly disagree.
 */
export function formatDistanceKm(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} km`;
}

/** `Turn right` / `Turn left` / `Facing the Qibla`, from the signed error. */
export function describeAlignment(error: number, isAligned: boolean): string {
  if (isAligned) return 'Facing the Qibla';
  return error > 0 ? 'Turn right' : 'Turn left';
}

/** The nearest cardinal or intercardinal name, for accessibility labels. */
const COMPASS_POINTS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const;

export function describeBearing(degrees: number): string {
  const wrapped = ((degrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(wrapped / 45) % 8];
}
