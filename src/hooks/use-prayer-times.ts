import * as Localization from 'expo-localization';
import * as React from 'react';
import { AppState } from 'react-native';

import { useLocation } from '@/hooks/use-location';
import { usePrayerSettings } from '@/hooks/use-prayer-settings';
import type { City } from '@/lib/cities';
import { dateFromDayKey, dayKey, startOfNextLocalDay } from '@/lib/date-format';
import type { LocationStatus, ResolvedLocation } from '@/lib/location-store';
import { describeSettings, type PrayerSettings } from '@/lib/prayer-settings';
import { buildTimeline, type PrayerTimeline } from '@/lib/prayer-times';

export type HomeState = 'loading' | 'needs-location' | 'ready';

export type UsePrayerTimesResult = {
  state: HomeState;
  /** The local civil day being shown, available before any location resolves. */
  day: Date;
  timeline: PrayerTimeline | null;
  location: ResolvedLocation | null;
  locationStatus: LocationStatus;
  canAskAgain: boolean;
  isStale: boolean;
  use24h: boolean;
  settings: PrayerSettings;
  updateSettings: (patch: Partial<PrayerSettings>) => void;
  methodLabel: string;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
  setCity: (city: City) => Promise<void>;
  useDeviceLocation: () => Promise<void>;
};

/** The largest delay `setTimeout` can hold in a signed 32-bit int. */
const MAX_TIMEOUT_MS = 2_147_483_000;

export function usePrayerTimes(): UsePrayerTimesResult {
  const location = useLocation();
  const [settings, updateSettings] = usePrayerSettings();

  // Read once at mount rather than during render: the React Compiler treats a
  // bare Date.now() in the render body as impure.
  const [nowStamp, setNowStamp] = React.useState(() => Date.now());

  const coords = location.location;
  // A string, not a Date, so the memo below has a stable dependency identity.
  const key = dayKey(new Date(nowStamp));

  const timeline = React.useMemo(
    () => (coords ? buildTimeline(coords, key, settings, nowStamp) : null),
    [coords, key, settings, nowStamp]
  );

  // The date is location-independent, so the header can render it for real even
  // while the location is still resolving -- and the screen never has to build
  // a Date during render to fall back on.
  const day = React.useMemo(() => dateFromDayKey(key), [key]);

  /*
   * One exact timeout instead of polling. It fires at whichever comes first:
   *
   * - the next prayer, which rolls the hero and the row highlighting; or
   * - local midnight, which rolls the header date and the whole day's list.
   *
   * Midnight matters on its own. Between 00:00 and Fajr the next prayer is
   * still hours away, so keying only off the prayer boundary would leave the
   * screen showing yesterday's date and yesterday's schedule until dawn.
   */
  const nextBoundary = timeline
    ? Math.min(timeline.next.time.getTime(), startOfNextLocalDay(new Date(nowStamp)).getTime())
    : null;

  React.useEffect(() => {
    if (nextBoundary == null) return;

    // Overshoot slightly so `now >= boundary` is unambiguous when it lands.
    const delay = Math.min(Math.max(nextBoundary - Date.now() + 500, 0), MAX_TIMEOUT_MS);
    const timer = setTimeout(() => setNowStamp(Date.now()), delay);

    // iOS suspends JS timers in the background and Android fires them late
    // under Doze, so resuming always recomputes from the wall clock.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNowStamp(Date.now());
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [nextBoundary]);

  const use24h = React.useMemo(() => {
    if (settings.timeFormat === '24h') return true;
    if (settings.timeFormat === '12h') return false;
    try {
      return Localization.getCalendars()[0]?.uses24hourClock ?? false;
    } catch {
      return false;
    }
  }, [settings.timeFormat]);

  const state: HomeState = timeline
    ? 'ready'
    : location.status === 'idle' || location.status === 'resolving'
      ? 'loading'
      : 'needs-location';

  return {
    state,
    day,
    timeline,
    location: coords,
    locationStatus: location.status,
    canAskAgain: location.canAskAgain,
    isStale: location.isStale,
    use24h,
    settings,
    updateSettings,
    methodLabel: describeSettings(settings),
    requestPermission: location.requestPermission,
    refresh: location.refresh,
    setCity: location.setCity,
    useDeviceLocation: location.useDeviceLocation,
  };
}
