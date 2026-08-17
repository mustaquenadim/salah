import { FARD_PRAYERS, PRAYER_ORDER, type PrayerName } from '@/lib/prayer-times';
import { STORAGE_KEYS, readJson, writeJson } from '@/lib/storage';

/**
 * Which prayers the user has asked to be reminded for.
 *
 * Kept out of `PrayerSettings` deliberately: that type is the *calculation*
 * contract -- method, madhab, the things that move the times themselves -- and
 * `applyCountryDefaults` is allowed to rewrite it from a location fix. A
 * reminder is a personal choice about being interrupted; nothing should ever
 * resolve one on the user's behalf.
 *
 * Same module-store shape as `settings-store.ts`, read through
 * `useSyncExternalStore`.
 */

export type PrayerReminders = Record<PrayerName, boolean>;

/**
 * Off for everything. Turning notifications on is the user's decision to make,
 * and Sunrise is a boundary rather than a prayer, so it is never remindable at
 * all -- see {@link isRemindable}.
 */
export const DEFAULT_REMINDERS: PrayerReminders = PRAYER_ORDER.reduce((acc, name) => {
  acc[name] = false;
  return acc;
}, {} as PrayerReminders);

/** Sunrise closes Fajr's window; there is no prayer to be reminded of. */
export function isRemindable(name: PrayerName): boolean {
  return FARD_PRAYERS.has(name);
}

let snapshot: PrayerReminders = DEFAULT_REMINDERS;
const listeners = new Set<() => void>();

let initialized = false;

function emit(next: PrayerReminders) {
  // Replaced wholesale, never mutated -- `getSnapshot` must return a stable
  // identity between changes or `useSyncExternalStore` loops forever.
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): PrayerReminders {
  return snapshot;
}

export function initReminders(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const stored = await readJson<Partial<PrayerReminders>>(STORAGE_KEYS.reminders);
    if (!stored) return;
    // Spread over the defaults so an unknown or missing key reads as `false`
    // rather than `undefined`.
    emit({ ...DEFAULT_REMINDERS, ...stored });
  })();
}

export function setReminder(name: PrayerName, enabled: boolean): void {
  if (!isRemindable(name)) return;
  if (snapshot[name] === enabled) return;

  const next = { ...snapshot, [name]: enabled };
  emit(next);
  void writeJson(STORAGE_KEYS.reminders, next);
}

export function toggleReminder(name: PrayerName): void {
  setReminder(name, !snapshot[name]);
}
