import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as React from 'react';
import { Platform } from 'react-native';

import { AdhanBanner } from '@/components/adhan-banner';
import { usePrayerNotifications } from '@/hooks/use-prayer-notifications';
import { usePrayerReminders } from '@/hooks/use-prayer-reminders';
import { usePrayerTimes } from '@/hooks/use-prayer-times';

/**
 * The full recording, played only in-process. The notification carries a
 * separate 23-second cut -- see `lib/notifications.ts` for why the two cannot
 * be the same file.
 */
const ADHAN_SOURCE = require('@/assets/audios/adhan.m4a');

/**
 * How late a crossing may be and still trigger playback.
 *
 * Opening the app two hours into Dhuhr's window must not start the adhan, but
 * tapping the notification -- which takes a few seconds -- must.
 */
const RECENT_MS = 90_000;

/**
 * Owns both halves of the reminder feature: the scheduled notifications, and
 * the in-app adhan for when the app happens to be open at the prayer time.
 *
 * Mounted in the tabs layout rather than on the home screen because neither
 * half is the home screen's business -- reminders must stay armed while the
 * user is on Qibla, and the adhan must be stoppable from wherever they are.
 */
export function PrayerAlerts() {
  const home = usePrayerTimes();
  const [reminders] = usePrayerReminders();

  usePrayerNotifications(home.location, home.settings, reminders);

  const player = useAudioPlayer(ADHAN_SOURCE);
  const status = useAudioPlayerStatus(player);

  /** The boundary already played, so a re-render never restarts the adhan. */
  const lastPlayedAt = React.useRef<number | null>(null);

  const current = home.timeline?.current ?? null;
  // Read as primitives so the effect is not re-run by a new entry object
  // carrying the same prayer.
  const currentName = current?.name ?? null;
  const currentLabel = current?.label ?? null;
  const currentAt = current?.time.getTime() ?? null;

  React.useEffect(() => {
    if (currentAt == null || currentName == null || currentLabel == null) return;
    if (!reminders[currentName]) return;
    if (lastPlayedAt.current === currentAt) return;
    if (Date.now() - currentAt > RECENT_MS) return;

    lastPlayedAt.current = currentAt;

    void (async () => {
      try {
        await setAudioModeAsync({
          // The adhan is a call to prayer; a flipped ringer switch should not
          // silence it once the user has explicitly asked to be called.
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          // Required for lock screen controls, which Android in turn requires
          // to let playback continue past ~3 minutes. The recording is 3:45.
          interruptionMode: 'doNotMix',
        });

        player.seekTo(0);
        player.play();

        if (Platform.OS !== 'web') {
          player.setActiveForLockScreen(true, { title: `Adhan · ${currentLabel}`, artist: 'Salah' });
        }
      } catch (error) {
        // Nothing to unwind: the banner is derived from the player, so a failed
        // start simply means it never appears.
        console.warn('[adhan] playback failed', error);
      }
    })();
  }, [currentAt, currentName, currentLabel, reminders, player]);

  // Tear down at the end of the recording so the lock screen does not keep
  // showing a finished track.
  React.useEffect(() => {
    if (!status.didJustFinish) return;
    if (Platform.OS !== 'web') player.setActiveForLockScreen(false);
  }, [status.didJustFinish, player]);

  function handleStop() {
    player.pause();
    player.seekTo(0);
    if (Platform.OS !== 'web') player.setActiveForLockScreen(false);
  }

  /*
   * Both halves of this are derived rather than stored. The player is the only
   * honest source of "is the adhan sounding", and every prayer window is far
   * longer than the 3:45 recording, so the prayer whose window we are in is
   * necessarily the one being called.
   */
  if (!status.playing || !currentLabel) return null;
  return <AdhanBanner label={currentLabel} onStop={handleStop} />;
}
