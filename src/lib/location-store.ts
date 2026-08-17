import * as Localization from 'expo-localization';
import * as Location from 'expo-location';

import { nearestCity, type City } from '@/lib/cities';
import { formatCoordinates } from '@/lib/date-format';
import { applyCountryDefaults } from '@/lib/settings-store';
import { STORAGE_KEYS, readJson, writeJson } from '@/lib/storage';

/**
 * Module-level location store, read through `useSyncExternalStore`.
 *
 * Owns the permission flow, the GPS fix, the place-name lookup, the cache, and
 * the manual-city fallback. Deliberately a single module instance: two
 * components each holding their own copy of this would run two permission
 * prompts, and the Qibla screen will need the same location later.
 */

export type LocationSource = 'gps' | 'manual' | 'cache';

export type LocationStatus =
  | 'idle'
  | 'resolving'
  | 'ready'
  /** Permission refused by the user. */
  | 'denied'
  /** OS location services are switched off entirely. */
  | 'disabled'
  /** Hardware error, or the fix timed out. */
  | 'unavailable';

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  timezone: string | null;
  source: LocationSource;
  updatedAt: number;
};

export type LocationSnapshot = {
  status: LocationStatus;
  /** May hold the cached location while `status` is still `resolving`. */
  location: ResolvedLocation | null;
  canAskAgain: boolean;
  isStale: boolean;
  error: string | null;
};

type LocationMode = 'auto' | 'manual';

const STALE_MS = 24 * 60 * 60 * 1000;
const FIX_TIMEOUT_MS = 10_000;
const GEOCODE_TIMEOUT_MS = 5_000;
const LAST_KNOWN_MAX_AGE_MS = 15 * 60 * 1000;
/** Distance that invalidates a cached place name. */
const RELABEL_THRESHOLD_KM = 5;

const INITIAL: LocationSnapshot = {
  status: 'idle',
  location: null,
  canAskAgain: true,
  isStale: false,
  error: null,
};

/*
 * This object identity is the contract with `useSyncExternalStore`: getSnapshot
 * must return the *same* object until something actually changes, or React
 * throws "The result of getSnapshot should be cached" and re-renders forever.
 * Only `emit` ever replaces it, and nothing mutates it in place.
 */
let snapshot: LocationSnapshot = INITIAL;
const listeners = new Set<() => void>();

let initialized = false;
let inFlight: Promise<void> | null = null;
/**
 * Mirrored in memory as well as in storage so that every entry point can check
 * it synchronously -- pull-to-refresh in particular must not quietly replace a
 * manually chosen city with a GPS fix.
 */
let mode: LocationMode = 'auto';

function emit(patch: Partial<LocationSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

function isStale(location: ResolvedLocation | null, now: number): boolean {
  return location ? now - location.updatedAt > STALE_MS : false;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): LocationSnapshot {
  return snapshot;
}

/** Rejects rather than hanging. `getCurrentPositionAsync` can wait forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function deviceTimezone(): string | null {
  try {
    return Localization.getCalendars()[0]?.timeZone ?? null;
  } catch {
    return null;
  }
}

function deviceRegionCode(): string | null {
  try {
    return Localization.getLocales()[0]?.regionCode ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves a human place name for a coordinate.
 *
 * Reverse geocoding is a network call and does not exist on web, so it is only
 * the first rung: nearest bundled city, then a formatted coordinate, both work
 * fully offline. A failed label must never block the prayer times.
 */
async function describeCoordinates(
  latitude: number,
  longitude: number
): Promise<Pick<ResolvedLocation, 'city' | 'region' | 'countryCode'>> {
  try {
    const [place] = await withTimeout(
      Location.reverseGeocodeAsync({ latitude, longitude }),
      GEOCODE_TIMEOUT_MS,
      'reverse geocode'
    );
    if (place) {
      const city = place.city ?? place.subregion ?? place.region;
      if (city) {
        return {
          city,
          region: place.country ?? place.region ?? null,
          countryCode: place.isoCountryCode ?? null,
        };
      }
    }
  } catch {
    // Offline, unsupported platform, or slow -- fall through to the offline path.
  }

  const near = nearestCity(latitude, longitude);
  return {
    city: near ? near.name : formatCoordinates(latitude, longitude),
    region: near ? near.country : null,
    countryCode: near ? near.countryCode : deviceRegionCode(),
  };
}

async function commit(location: ResolvedLocation) {
  emit({
    status: 'ready',
    location,
    isStale: isStale(location, Date.now()),
    error: null,
  });
  await writeJson(STORAGE_KEYS.location, location);
  void applyCountryDefaults(location.countryCode);
}

/** Steps 3-7 of the boot sequence: services, permission, fix, label, persist. */
async function resolveFromDevice(options: { forceFresh: boolean }): Promise<void> {
  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
  if (!servicesEnabled) {
    emit({ status: 'disabled', error: null });
    return;
  }

  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (!permission.granted) {
    emit({ status: 'denied', canAskAgain: permission.canAskAgain, error: null });
    return;
  }

  emit({ status: snapshot.location ? snapshot.status : 'resolving', canAskAgain: true });

  // Two-stage: the cached OS fix lands immediately so the screen is never
  // blocked on a cold lock, then the fresh one refines it.
  let position: Location.LocationObject | null = null;
  if (!options.forceFresh) {
    position = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    }).catch(() => null);
    if (position) {
      await applyPosition(position);
    }
  }

  try {
    const fresh = await withTimeout(
      // Balanced (~100 m) on purpose: 100 m of longitude is about 0.4 seconds of
      // solar time, so higher accuracy costs battery for no visible gain, and
      // Balanced locks far faster indoors.
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      FIX_TIMEOUT_MS,
      'location fix'
    );
    await applyPosition(fresh);
  } catch (error) {
    // A stale-but-real position still gives correct times, so only surface the
    // failure when we have nothing at all to show.
    if (!snapshot.location) {
      emit({
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Could not determine your location',
      });
    }
  }
}

async function applyPosition(position: Location.LocationObject): Promise<void> {
  const { latitude, longitude } = position.coords;
  const cached = snapshot.location;

  // Reuse the existing label unless the fix actually moved somewhere else --
  // reverse geocoding is a network round trip worth skipping.
  const canReuseLabel =
    cached?.city != null &&
    Math.abs(cached.latitude - latitude) < 1 &&
    Math.abs(cached.longitude - longitude) < 1 &&
    haversineKm(cached, { latitude, longitude }) < RELABEL_THRESHOLD_KM;

  const label = canReuseLabel
    ? { city: cached.city, region: cached.region, countryCode: cached.countryCode }
    : await describeCoordinates(latitude, longitude);

  await commit({
    latitude,
    longitude,
    ...label,
    timezone: deviceTimezone(),
    source: 'gps',
    updatedAt: Date.now(),
  });
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude));
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Boot sequence. Idempotent -- safe to call from every consumer's effect.
 *
 * Reads the cache *before* touching permissions so a returning user sees real
 * prayer times on the first frame, with no prompt and no skeleton.
 */
export function initLocation(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const cached = await readJson<ResolvedLocation>(STORAGE_KEYS.location);
    if (cached) {
      emit({
        status: 'ready',
        location: { ...cached, source: 'cache' },
        isStale: isStale(cached, Date.now()),
      });
      void applyCountryDefaults(cached.countryCode);
    } else {
      emit({ status: 'resolving' });
    }

    mode = (await readJson<LocationMode>(STORAGE_KEYS.locationMode)) ?? 'auto';
    // A manual city is a deliberate choice; GPS must never silently replace it.
    if (mode === 'manual' && cached) return;

    await run({ forceFresh: false });
  })();
}

function run(options: { forceFresh: boolean }): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = resolveFromDevice(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Re-asks for permission after the user taps "Enable location".
 *
 * An explicit tap also means they want GPS back, so this leaves manual mode.
 */
export async function requestLocationPermission(): Promise<void> {
  mode = 'auto';
  await writeJson(STORAGE_KEYS.locationMode, 'auto');
  await run({ forceFresh: true });
}

/**
 * Pull-to-refresh. Takes a fresh fix, unless the user has pinned a city -- in
 * which case there is nothing to refresh and overwriting it would be wrong.
 */
export async function refreshLocation(): Promise<void> {
  if (mode === 'manual') return;
  await run({ forceFresh: true });
}

export async function setManualCity(city: City): Promise<void> {
  mode = 'manual';
  await writeJson(STORAGE_KEYS.locationMode, 'manual');
  await commit({
    latitude: city.latitude,
    longitude: city.longitude,
    city: city.name,
    region: city.country,
    countryCode: city.countryCode,
    timezone: city.timezone,
    source: 'manual',
    updatedAt: Date.now(),
  });
}

/** Reverts a manual choice and goes back to GPS. */
export async function useDeviceLocation(): Promise<void> {
  mode = 'auto';
  await writeJson(STORAGE_KEYS.locationMode, 'auto');
  await run({ forceFresh: true });
}
