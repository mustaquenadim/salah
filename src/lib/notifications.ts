import { Coordinates } from 'adhan';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays } from '@/lib/date-format';
import { toCalculationParameters, type PrayerSettings } from '@/lib/prayer-settings';
import { FARD_PRAYERS, buildDaySchedule, type LatLng, type PrayerName } from '@/lib/prayer-times';
import type { PrayerReminders } from '@/lib/reminder-store';

/**
 * Scheduling for the per-prayer adhan reminders.
 *
 * The shape of this file is dictated by two platform ceilings that cannot be
 * engineered around:
 *
 * 1. **iOS allows 64 pending local notifications.** Prayer times move every day,
 *    so there is no repeating trigger that stays correct -- each occurrence is
 *    its own `DATE` trigger, and we re-arm a rolling window every time the app
 *    comes forward. A user who never opens the app eventually runs off the end
 *    of the window; that is inherent, not a bug.
 * 2. **iOS caps custom notification sounds at 30 seconds** and rejects AAC, so
 *    the notification plays `adhan_notification.wav` (a trimmed, converted cut)
 *    while the full recording is only ever played in-process by `PrayerAlerts`.
 */

/**
 * Base filename only -- the config plugin copies the file into the native
 * bundle at build time, so the path in app.json is irrelevant at runtime.
 * Changing the audio therefore requires a new build; it is not OTA-updatable.
 */
const ADHAN_SOUND = 'adhan_notification.wav';

/**
 * An Android channel's sound is immutable after creation, so the id carries a
 * version. Shipping a different recording means bumping this to `adhan-v2` --
 * editing the channel in place would silently keep the old sound.
 */
const ADHAN_CHANNEL_ID = 'adhan-v1';

/** Marks our requests so a future notification type is not cancelled with them. */
const REMINDER_KIND = 'prayer-reminder';

/** Four under the iOS limit of 64, leaving room for anything scheduled elsewhere. */
const MAX_SCHEDULED = 60;

/** Ceiling on how far ahead to arm when few prayers are enabled. */
const MAX_HORIZON_DAYS = 30;

/** Never schedule for a moment so close that it may pass before the write lands. */
const LEAD_MS = 5_000;

/*
 * No sound when the app is already open: `PrayerAlerts` plays the full 3:45
 * recording in-process at that moment, and the 23-second notification cut
 * firing over the top of it would be two adhans at once.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** expo-notifications has no scheduling on web, and this app ships a web build. */
const SUPPORTED = Platform.OS !== 'web';

export async function getNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted;
}

/**
 * Returns whether reminders may be scheduled, asking once if the OS still
 * allows it. A `false` here means the user must go to Settings.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    // No `allowCriticalAlerts`: that needs an Apple entitlement granted almost
    // exclusively to medical and safety apps, and asking without it fails.
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
    name: 'Adhan',
    importance: Notifications.AndroidImportance.MAX,
    sound: ADHAN_SOUND,
    vibrationPattern: [0, 250, 250, 250],
  });
}

type ScheduleInput = {
  coords: LatLng | null;
  settings: PrayerSettings;
  reminders: PrayerReminders;
};

type Occurrence = { name: PrayerName; label: string; date: Date };

/**
 * Walks forward day by day collecting enabled prayers until the cap is hit.
 *
 * Recomputes each day from scratch rather than projecting today's times
 * forward: Fajr and Isha can move several minutes a day, and around a DST
 * transition they move by an hour.
 */
function collectUpcoming(
  coords: LatLng,
  settings: PrayerSettings,
  reminders: PrayerReminders,
  now: Date,
  limit: number
): Occurrence[] {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = toCalculationParameters(settings, coordinates);
  const found: Occurrence[] = [];

  for (let offset = 0; offset < MAX_HORIZON_DAYS && found.length < limit; offset++) {
    for (const entry of buildDaySchedule(coordinates, addDays(now, offset), params)) {
      if (found.length >= limit) break;
      // Sunrise is in the schedule but is a boundary, not a prayer.
      if (!FARD_PRAYERS.has(entry.name)) continue;
      if (!reminders[entry.name]) continue;
      if (entry.time.getTime() - now.getTime() < LEAD_MS) continue;

      found.push({ name: entry.name, label: entry.label, date: entry.time });
    }
  }

  return found;
}

/** Drops only our own requests, leaving anything else the app may schedule. */
async function cancelExisting(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.kind === REMINDER_KIND)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

async function runSync({ coords, settings, reminders }: ScheduleInput): Promise<number> {
  if (!SUPPORTED) return 0;

  const enabled = (Object.keys(reminders) as PrayerName[]).some(
    (name) => reminders[name] && FARD_PRAYERS.has(name)
  );

  // Permission can be revoked in Settings while the app is backgrounded, so it
  // is checked on every sync rather than only at the point of toggling.
  if (!coords || !enabled || !(await getNotificationPermission())) {
    await cancelExisting();
    return 0;
  }

  await ensureAndroidChannel();

  const upcoming = collectUpcoming(coords, settings, reminders, new Date(), MAX_SCHEDULED);

  // Cancelled as late as possible: if computing the new set throws, the old
  // reminders are still armed rather than the user being left with none.
  await cancelExisting();

  for (const occurrence of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: occurrence.label,
        body: `It's time for ${occurrence.label}.`,
        // iOS reads this; on Android 8+ the channel owns the sound instead.
        sound: ADHAN_SOUND,
        data: { kind: REMINDER_KIND, prayer: occurrence.name },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: occurrence.date,
        channelId: ADHAN_CHANNEL_ID,
      },
    });
  }

  return upcoming.length;
}

/*
 * Serialised. A settings change and an app-foreground re-arm can land together,
 * and two interleaved cancel/schedule passes would leave a half-written set.
 */
let queue: Promise<unknown> = Promise.resolve();

export function syncPrayerNotifications(input: ScheduleInput): Promise<number> {
  const next = queue.then(() =>
    runSync(input).catch((error) => {
      console.warn('[notifications] failed to sync prayer reminders', error);
      return 0;
    })
  );
  queue = next;
  return next;
}
