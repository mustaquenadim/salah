import {
  DEFAULT_SETTINGS,
  resolveDefaultSettings,
  type PrayerSettings,
} from '@/lib/prayer-settings';
import { STORAGE_KEYS, readJson, writeJson } from '@/lib/storage';

/**
 * Module-level store for {@link PrayerSettings}, read through
 * `useSyncExternalStore`.
 *
 * A module store rather than a Context provider because this state is
 * persisted, singular, and needed outside the tree; and rather than hook-local
 * state because two consumers must not hold two copies of it.
 */

let snapshot: PrayerSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

let initialized = false;
/** Resolves once the persisted settings have been read (or found absent). */
let loaded: Promise<void> = Promise.resolve();

function emit(next: PrayerSettings) {
  // Replaced wholesale, never mutated: `getSnapshot` has to return a stable
  // object identity between changes or `useSyncExternalStore` loops forever.
  snapshot = next;
  for (const listener of listeners) listener();
}

function persist(next: PrayerSettings) {
  emit(next);
  void writeJson(STORAGE_KEYS.settings, next);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): PrayerSettings {
  return snapshot;
}

export function initSettings(): void {
  if (initialized) return;
  initialized = true;

  loaded = (async () => {
    const stored = await readJson<Partial<PrayerSettings>>(STORAGE_KEYS.settings);
    if (stored) {
      // Spread over the defaults so a field added in a later version is
      // populated rather than undefined.
      emit({ ...DEFAULT_SETTINGS, ...stored });
    }
  })();
}

/** A deliberate user change. Pins the choice against later country defaults. */
export function updateSettings(patch: Partial<PrayerSettings>): void {
  const touchesCalculation = 'methodId' in patch || 'madhab' in patch;
  persist({
    ...snapshot,
    ...patch,
    userOverridden: snapshot.userOverridden || touchesCalculation,
  });
}

/**
 * Applies the method and madhab customary in `countryCode`.
 *
 * Awaits the initial load first: without that, a fast location fix could
 * resolve a country default over the user's stored choice before it had even
 * been read back from disk.
 */
export async function applyCountryDefaults(countryCode: string | null): Promise<void> {
  await loaded;
  if (snapshot.userOverridden) return;

  const resolved = resolveDefaultSettings(countryCode);
  if (resolved.methodId === snapshot.methodId && resolved.madhab === snapshot.madhab) return;

  persist({ ...snapshot, methodId: resolved.methodId, madhab: resolved.madhab });
}
