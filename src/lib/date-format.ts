/**
 * All date/time formatting and local-day arithmetic for the app.
 *
 * Deliberately free of `Intl` and `toLocale*`. Hermes does not implement
 * ECMA-402 in JavaScript -- it delegates to `android.icu` on Android and
 * `NSDateFormatter` on iOS, which are two different implementations with
 * different bugs. For a prayer app, the two platforms quietly disagreeing about
 * what day it is would be a silent correctness failure, so the names live here
 * as plain arrays instead.
 *
 * Consequence: English only in v1. This file is the i18n seam.
 */

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** `18:42` or `6:42 PM`. */
export function formatTime(date: Date, use24h: boolean): string {
  const hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  if (use24h) {
    return `${pad2(hours)}:${minutes}`;
  }
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** `Monday, 17 August 2026`. */
export function formatGregorian(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** `4:32:10` past an hour, `32:10` under one, never negative. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${minutes}:${pad2(seconds)}`;
}

/** `4h 32m` or `32m` -- for coarse, non-ticking copy. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * `YYYY-MM-DD` for the **local** civil day.
 *
 * Uses the local getters on purpose. `toISOString().slice(0, 10)` is UTC and
 * would roll the day over at the wrong moment for every user not on GMT --
 * shifting the whole prayer schedule by a day for part of each night.
 */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Inverse of {@link dayKey}: local midnight on that day. */
export function dateFromDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Local midnight at the start of tomorrow -- the day-rollover boundary. */
export function startOfNextLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

/** `21.4°N, 39.8°E` -- the last rung of the location-label ladder. */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(1)}°${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(1)}°${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}
