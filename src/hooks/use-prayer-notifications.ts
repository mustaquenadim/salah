import * as React from 'react';
import { AppState } from 'react-native';

import { syncPrayerNotifications } from '@/lib/notifications';
import type { PrayerSettings } from '@/lib/prayer-settings';
import type { LatLng } from '@/lib/prayer-times';
import type { PrayerReminders } from '@/lib/reminder-store';

/**
 * Keeps the armed reminders in step with everything that can move a prayer
 * time, and rolls the window forward whenever the app comes back.
 *
 * The re-arm on `active` is what makes the iOS 64-notification cap survivable:
 * the window is only ever a couple of weeks deep, so it has to be extended
 * every time we get the chance.
 */
export function usePrayerNotifications(
  coords: LatLng | null,
  settings: PrayerSettings,
  reminders: PrayerReminders
): void {
  // Depend on the numbers, not the location object: a refresh hands back a new
  // identity for an unchanged fix, which would re-arm ~60 notifications for
  // nothing. `settings` and `reminders` come from module stores and are already
  // identity-stable between real changes.
  const latitude = coords?.latitude ?? null;
  const longitude = coords?.longitude ?? null;

  React.useEffect(() => {
    const resolved = latitude != null && longitude != null ? { latitude, longitude } : null;
    const sync = () => {
      void syncPrayerNotifications({ coords: resolved, settings, reminders });
    };

    sync();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => subscription.remove();
  }, [latitude, longitude, settings, reminders]);
}
