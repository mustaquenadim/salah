import { Coordinates, PrayerTimes, type CalculationParameters } from 'adhan';

import { addDays, dateFromDayKey, dayKey } from '@/lib/date-format';
import { toCalculationParameters, type PrayerSettings } from '@/lib/prayer-settings';

/**
 * Pure prayer-time computation. No React, no I/O, no persistence -- everything
 * here is a function of (coordinates, day, settings, now).
 *
 * Timezone note: adhan derives the civil day from the *device's* local calendar
 * fields, and we format in device-local time. That is correct whenever the
 * device timezone matches the location, which covers GPS and covers picking
 * one's own city from the fallback list. It is wrong if someone manually
 * selects Jakarta while their phone is on Europe/London.
 * `ResolvedLocation.timezone` is already persisted, so fixing that later is
 * confined to `date-format.ts` rather than to this file.
 */

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_ORDER: readonly PrayerName[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/** Sunrise is a boundary, not a prayer -- it ends Fajr's window. */
export const FARD_PRAYERS: ReadonlySet<PrayerName> = new Set<PrayerName>([
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
]);

export type PrayerStatus = 'past' | 'current' | 'next' | 'upcoming';

export type PrayerEntry = {
  name: PrayerName;
  label: string;
  time: Date;
  isFard: boolean;
};

export type PrayerTimeline = {
  /** The local civil day `entries` describes. */
  day: Date;
  /** Today's six boundaries, ascending. Entries adhan could not compute are omitted. */
  entries: PrayerEntry[];
  statusOf: Record<PrayerName, PrayerStatus>;
  /** The fard prayer whose window contains now. Null between sunrise and Dhuhr. */
  current: PrayerEntry | null;
  /** The next boundary. May be tomorrow's Fajr. */
  next: PrayerEntry;
  nextIsTomorrow: boolean;
  /** The boundary the current window opened at. May be yesterday's Isha. */
  windowStart: Date;
  /** 0..1 through the current window. */
  windowProgress: number;
};

export type LatLng = { latitude: number; longitude: number };

/** The six boundaries for one local civil day, ascending, NaN-filtered. */
export function buildDaySchedule(
  coordinates: Coordinates,
  date: Date,
  params: CalculationParameters
): PrayerEntry[] {
  const times = new PrayerTimes(coordinates, date, params);
  const entries: PrayerEntry[] = [];

  for (const name of PRAYER_ORDER) {
    const time = times[name];
    // adhan returns Invalid Date for Fajr/Isha at extreme latitudes when it
    // cannot resolve them. Such an entry is dropped rather than rendered NaN.
    if (!(time instanceof Date) || !Number.isFinite(time.getTime())) continue;
    entries.push({ name, label: PRAYER_LABELS[name], time, isFard: FARD_PRAYERS.has(name) });
  }

  return entries;
}

/**
 * Builds the full timeline for `key`'s civil day.
 *
 * Computes yesterday and tomorrow as well, which is what makes the two awkward
 * windows correct:
 *
 * - **After Isha** adhan's own `nextPrayer()` returns `Prayer.None`, so the next
 *   boundary has to come from tomorrow's Fajr.
 * - **Between midnight and Fajr** the current prayer is *yesterday's* Isha, and
 *   the progress bar's origin is yesterday's Isha time. Without that, the bar
 *   snaps to 100% at midnight.
 *
 * Returns null when nothing could be computed at all for this location.
 */
export function buildTimeline(
  coords: LatLng,
  key: string,
  settings: PrayerSettings,
  nowMs: number
): PrayerTimeline | null {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = toCalculationParameters(settings, coordinates);
  const day = dateFromDayKey(key);

  const entries = buildDaySchedule(coordinates, day, params);
  if (entries.length === 0) return null;

  // Ascending overall, since each day's schedule is ascending and the days are
  // in order. `windowStart` and `next` are just a walk over this.
  const boundaries = [
    ...buildDaySchedule(coordinates, addDays(day, -1), params),
    ...entries,
    ...buildDaySchedule(coordinates, addDays(day, 1), params),
  ];

  let previous: PrayerEntry | null = null;
  let next: PrayerEntry | null = null;
  for (const entry of boundaries) {
    if (entry.time.getTime() <= nowMs) {
      previous = entry;
    } else {
      next = entry;
      break;
    }
  }

  // Only possible if the location has no computable boundary ahead at all.
  if (!next) return null;

  // `current` considers only the fard prayers, so the sunrise->Dhuhr gap
  // correctly has no current prayer while still anchoring the progress bar.
  const current = previous && previous.isFard ? previous : null;
  const windowStart = previous ? previous.time : new Date(day);

  const span = Math.max(1, next.time.getTime() - windowStart.getTime());
  const windowProgress = Math.min(1, Math.max(0, (nowMs - windowStart.getTime()) / span));

  const statusOf = {} as Record<PrayerName, PrayerStatus>;
  for (const entry of entries) {
    if (current && entry.name === current.name && entry.time.getTime() === current.time.getTime()) {
      statusOf[entry.name] = 'current';
    } else if (entry.time.getTime() === next.time.getTime() && entry.name === next.name) {
      statusOf[entry.name] = 'next';
    } else if (entry.time.getTime() <= nowMs) {
      statusOf[entry.name] = 'past';
    } else {
      statusOf[entry.name] = 'upcoming';
    }
  }

  return {
    day,
    entries,
    statusOf,
    current,
    next,
    nextIsTomorrow: dayKey(next.time) !== key,
    windowStart,
    windowProgress,
  };
}
