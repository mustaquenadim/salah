import { useFocusEffect } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';
import * as React from 'react';
import { AppState, Platform } from 'react-native';

import { FLAT_ENTER_DEG, FLAT_EXIT_DEG, tiltFromFlatDegrees } from '@/lib/qibla';

/**
 * Deliberately a boolean, not the raw angle. Samples are gated behind a dwell
 * so the hint stays calm, which means any angle exposed here would be up to a
 * second stale -- fine for "is it flat?", quietly wrong for anything trying to
 * position something with it.
 */
export type DeviceTilt = {
  /** False when there is no accelerometer, or motion permission was refused. */
  available: boolean;
  isFlat: boolean;
};

/** 5Hz. Ample for a posture test, and cheap. */
const UPDATE_INTERVAL_MS = 200;
/** How long a posture change must hold before the UI reacts to it. */
const DWELL_MS = 1200;

/*
 * Starts flat so no hint can flash during the first samples, while the phone is
 * still on its way into the user's hand.
 */
const INITIAL: DeviceTilt = { available: false, isFlat: true };

type Pending = { flat: boolean; since: number } | null;

/**
 * Whether the phone is lying flat, from the gravity vector.
 *
 * Feeds one hint: hold the phone level. Tilting it swings the magnetometer
 * reading, and a compass held at an angle lies quietly rather than obviously.
 *
 * A denied motion permission returns `available: false` and `isFlat: true`,
 * silently. The compass does not depend on this hook, and degrading the whole
 * screen because someone refused an optional sensor would be the wrong trade.
 *
 * @param enabled Pass false to keep the sensor off.
 */
export function useDeviceTilt(enabled: boolean): DeviceTilt {
  const [tilt, setTilt] = React.useState<DeviceTilt>(INITIAL);
  const [appActive, setAppActive] = React.useState(() => AppState.currentState === 'active');

  const isFlatRef = React.useRef(true);
  const pendingRef = React.useRef<Pending>(null);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!enabled || !appActive || Platform.OS === 'web') return;

      let cancelled = false;
      let subscription: { remove: () => void } | null = null;

      isFlatRef.current = true;
      pendingRef.current = null;

      void (async () => {
        const isAvailable = await DeviceMotion.isAvailableAsync().catch(() => false);
        if (cancelled || !isAvailable) return;

        const permission = await DeviceMotion.requestPermissionsAsync().catch(() => null);
        if (cancelled || !permission?.granted) return;

        DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
        const next = DeviceMotion.addListener((measurement) => {
          const gravity = measurement.accelerationIncludingGravity;
          if (!gravity) return;

          const degrees = tiltFromFlatDegrees(gravity);
          if (degrees == null) return;

          const wasFlat = isFlatRef.current;
          // Hysteresis: the posture has to cross a wider band to be dropped
          // than it did to be entered, so a hand shaking on the boundary does
          // not flip the hint back and forth.
          const flat = wasFlat ? degrees <= FLAT_EXIT_DEG : degrees <= FLAT_ENTER_DEG;

          if (flat === wasFlat) {
            pendingRef.current = null;
            return;
          }

          // ...and on top of the hysteresis, a dwell: picking the phone up
          // sweeps through every angle on the way, and without this the hint
          // strobes for the whole journey.
          const now = Date.now();
          const pending = pendingRef.current;
          if (!pending || pending.flat !== flat) {
            pendingRef.current = { flat, since: now };
            return;
          }
          if (now - pending.since < DWELL_MS) return;

          isFlatRef.current = flat;
          pendingRef.current = null;
          setTilt({ available: true, isFlat: flat });
        });

        if (cancelled) {
          next.remove();
          return;
        }
        subscription = next;
        setTilt((current) => ({ ...current, available: true }));
      })();

      return () => {
        cancelled = true;
        subscription?.remove();
        subscription = null;
      };
    }, [enabled, appActive])
  );

  return tilt;
}
