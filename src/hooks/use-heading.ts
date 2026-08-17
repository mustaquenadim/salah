import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import * as React from 'react';
import { AppState, Platform } from 'react-native';

import type { LocationStatus } from '@/lib/location-store';
import {
  ALIGN_ENTER_DEG,
  ALIGN_EXIT_DEG,
  alignmentErrorDegrees,
  normalizeSignedDegrees,
  smoothHeading,
} from '@/lib/qibla';

/** How much the OS trusts the compass right now. */
export type CompassCalibration = 'good' | 'low' | 'unusable';

export type HeadingStatus =
  /** Probing hardware, or not yet asked to start. */
  | 'idle'
  /** No magnetometer, or the platform cannot deliver a heading at all. */
  | 'unsupported'
  /**
   * The hardware is there but location services are not authorized, so the OS
   * will not report a heading. Distinct from `unsupported` because the fix is
   * a permission, not a different phone.
   */
  | 'unauthorized'
  /** Delivering samples. */
  | 'active';

export type HeadingState = {
  status: HeadingStatus;
  /** Smoothed, in [0, 360). Null until the first sample lands. */
  heading: number | null;
  /** False when falling back to magnetic north because true north is unavailable. */
  isTrueNorth: boolean;
  calibration: CompassCalibration;
  /** Signed offset from the device's facing to the target; positive is right. */
  alignmentError: number | null;
  /** Whether the device is pointed at the target, with hysteresis applied. */
  isAligned: boolean;
};

/** Weight of each new sample in the circular EMA. */
const SMOOTHING_ALPHA = 0.4;
/** Movement below this is noise and is not worth a re-render. */
const MIN_EMIT_DELTA_DEG = 0.75;
/** If nothing has arrived by now, nothing is coming -- see below. */
const FIRST_SAMPLE_TIMEOUT_MS = 3000;
/** How long accuracy must stay at rock bottom before we call it unusable. */
const BAD_ACCURACY_DWELL_MS = 1500;

const IDLE: HeadingState = {
  status: 'idle',
  heading: null,
  isTrueNorth: false,
  calibration: 'good',
  alignmentError: null,
  isAligned: false,
};

const UNSUPPORTED: HeadingState = { ...IDLE, status: 'unsupported' };
const UNAUTHORIZED: HeadingState = { ...IDLE, status: 'unauthorized' };

/**
 * Maps the OS accuracy bucket to something the UI can act on.
 *
 * Deliberately asymmetric. `accuracy` flaps between 1 and 2 constantly in
 * normal use, so an upgrade is instant but a downgrade to `unusable` has to
 * hold for a continuous 1.5s -- without that, the calibration card strobes.
 *
 * Missing or non-numeric accuracy is treated as good: several Android OEMs
 * never raise the accuracy callback at all, and nagging someone to wave their
 * phone in a figure of eight because their vendor did not implement a callback
 * is worse than saying nothing.
 */
function resolveCalibration(
  accuracy: unknown,
  now: number,
  sinceRef: React.RefObject<number | null>
): CompassCalibration {
  if (typeof accuracy !== 'number') {
    sinceRef.current = null;
    return 'good';
  }
  if (accuracy >= 2) {
    sinceRef.current = null;
    return 'good';
  }
  if (accuracy === 1) {
    sinceRef.current = null;
    return 'low';
  }
  if (sinceRef.current == null) sinceRef.current = now;
  return now - sinceRef.current >= BAD_ACCURACY_DWELL_MS ? 'unusable' : 'low';
}

/**
 * Live device heading from `expo-location`, scoped to screen focus.
 *
 * `watchHeadingAsync` rather than the raw `Magnetometer` on purpose: it returns
 * `trueHeading`, already corrected for magnetic declination by the OS. Doing
 * that correction here would mean bundling a World Magnetic Model and keeping
 * it current, for a worse answer than the one the platform already has.
 *
 * The subscription is tied to focus *and* to app state. Focus alone is not
 * enough: backgrounding the app while sitting on this tab never blurs the
 * screen, so the magnetometer would keep running in the user's pocket. Folding
 * `appActive` into the callback's dependencies means the effect tears down and
 * re-subscribes for free.
 *
 * Alignment is computed here, inside the sample handler, rather than derived
 * from `heading` by the caller. Two reasons: the hysteresis needs to remember
 * its own last answer, which is honest mutable state in an event callback and
 * an awkward render-time ref anywhere else; and it keeps heading and alignment
 * in one atomic snapshot instead of letting them disagree for a render.
 *
 * @param enabled Pass false to keep the sensor off -- e.g. while there is no
 *   location to compute a bearing against.
 * @param targetBearing Bearing to measure alignment against, in degrees
 *   clockwise from true north. Null leaves `alignmentError` null.
 * @param locationStatus The location store's status. Not read directly -- it is
 *   here so that granting permission re-runs the subscription, which would
 *   otherwise stay parked on `unauthorized` until the screen lost focus.
 */
export function useHeading(
  enabled: boolean,
  targetBearing: number | null,
  locationStatus: LocationStatus
): HeadingState {
  const [state, setState] = React.useState<HeadingState>(IDLE);

  // Read once at mount rather than in the render body: the React Compiler
  // treats `AppState.currentState` there as an impure read.
  const [appActive, setAppActive] = React.useState(() => AppState.currentState === 'active');

  const smoothedRef = React.useRef<number | null>(null);
  const badAccuracySinceRef = React.useRef<number | null>(null);

  // What the last emitted snapshot said, so the handler can decide whether a
  // new one is worth a render. Written only from the handler -- never during
  // render, where a ref write would be an impurity.
  const emittedRef = React.useRef({
    heading: null as number | null,
    alignmentError: null as number | null,
    isAligned: false,
    isTrueNorth: false,
    calibration: 'good' as CompassCalibration,
  });

  // Held in a ref so a change of bearing -- the user picking another city --
  // does not tear down and restart the sensor subscription.
  const targetBearingRef = React.useRef(targetBearing);
  React.useEffect(() => {
    targetBearingRef.current = targetBearing;
  }, [targetBearing]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!enabled || !appActive) return;

      // Short-circuit before touching a sensor: web heading rides on
      // `deviceorientationabsolute`, which needs HTTPS and an explicit user
      // gesture on iOS Safari. The static dial is the better answer there.
      if (Platform.OS === 'web') {
        setState(UNSUPPORTED);
        return;
      }

      // The store has already been told access is refused, so skip the async
      // round-trip and settle on the answer now. The permission check below
      // still runs for every other status -- this is a shortcut, not the
      // safeguard, because a cached fix can outlive its permission without the
      // store's status ever saying so.
      if (locationStatus === 'denied' || locationStatus === 'disabled') {
        setState(UNAUTHORIZED);
        return;
      }

      let cancelled = false;
      let subscription: Location.LocationSubscription | null = null;
      let firstSampleTimer: ReturnType<typeof setTimeout> | null = null;

      // Reset per focus so a heading from the last visit cannot seed the
      // smoother and drag the first frame in from the wrong direction.
      smoothedRef.current = null;
      badAccuracySinceRef.current = null;
      emittedRef.current = {
        heading: null,
        alignmentError: null,
        isAligned: false,
        isTrueNorth: false,
        calibration: 'good',
      };

      function handleSample(sample: Location.LocationHeadingObject) {
        // `trueHeading` is -1 when it cannot be computed. By the time this hook
        // is enabled the location store has already secured foreground
        // permission, so that is not the denial case -- it means Android has
        // permission but no fix yet, and it resolves itself once one lands.
        const isTrueNorth = sample.trueHeading >= 0;
        const raw = isTrueNorth ? sample.trueHeading : sample.magHeading;
        if (!Number.isFinite(raw) || raw < 0) return;

        const smoothed = smoothHeading(smoothedRef.current, raw, SMOOTHING_ALPHA);
        smoothedRef.current = smoothed;

        const now = Date.now();
        const previous = emittedRef.current;
        const target = targetBearingRef.current;

        const alignmentError = target == null ? null : alignmentErrorDegrees(target, smoothed);

        /*
         * Hysteresis: it takes 3 degrees to claim alignment but 6 to lose it,
         * so a hand shaking on the boundary cannot make the state chatter.
         *
         * 3 degrees is a UX affordance, not a precision claim -- iOS's own
         * "high accuracy" bucket is anything under 20, and 3 degrees over
         * 5,000km is a couple of hundred kilometres of arc. It reads as "you
         * are pointed there", which is the honest promise.
         */
        const isAligned =
          alignmentError == null
            ? false
            : Math.abs(alignmentError) <= (previous.isAligned ? ALIGN_EXIT_DEG : ALIGN_ENTER_DEG);

        const headingMoved =
          previous.heading == null ||
          Math.abs(normalizeSignedDegrees(smoothed - previous.heading)) >= MIN_EMIT_DELTA_DEG;
        // Checked separately so that re-targeting on a motionless phone still
        // lands: the bearing can change without the heading moving at all.
        const targetMoved =
          (previous.alignmentError == null) !== (alignmentError == null) ||
          (alignmentError != null &&
            previous.alignmentError != null &&
            Math.abs(alignmentError - previous.alignmentError) >= MIN_EMIT_DELTA_DEG);

        const calibration = resolveCalibration(sample.accuracy, now, badAccuracySinceRef);
        const metaChanged =
          isAligned !== previous.isAligned ||
          isTrueNorth !== previous.isTrueNorth ||
          calibration !== previous.calibration;

        /*
         * The gate that keeps a phone lying still on a table at zero renders
         * rather than ten a second. An EMA converges asymptotically, so the
         * movement test alone leaves a sub-threshold residue that never emits
         * -- but it is bounded well under the alignment threshold, and any
         * creep that does cross a boundary shows up in `metaChanged`.
         */
        if (!headingMoved && !targetMoved && !metaChanged) return;

        emittedRef.current = {
          heading: smoothed,
          alignmentError,
          isAligned,
          isTrueNorth,
          calibration,
        };
        setState({
          status: 'active',
          heading: smoothed,
          isTrueNorth,
          calibration,
          alignmentError,
          isAligned,
        });
      }

      void (async () => {
        /*
         * Permission is checked before subscribing, never after, and this is
         * load-bearing rather than defensive.
         *
         * A location can outlive its permission: the store serves a cached fix
         * or a hand-picked city long after access was revoked, so "we have
         * coordinates" is not "we may read the compass". Subscribing anyway
         * gets the watch registered and then, on teardown, expo-location calls
         * `removeWatchAsync` without awaiting or catching it -- an unhandled
         * rejection thrown from inside the library, which no try/catch at this
         * call site can reach. Not subscribing is the only place the problem
         * can be fixed.
         *
         * Checked, never requested: prompting is the location store's job, and
         * two owners of one prompt is how apps get permanently denied.
         */
        const permission = await Location.getForegroundPermissionsAsync().catch(() => null);
        if (cancelled) return;
        if (!permission?.granted) {
          setState(UNAUTHORIZED);
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
        if (cancelled) return;
        if (!servicesEnabled) {
          setState(UNAUTHORIZED);
          return;
        }

        const hasMagnetometer = await Magnetometer.isAvailableAsync().catch(() => false);
        if (cancelled) return;
        if (!hasMagnetometer) {
          setState(UNSUPPORTED);
          return;
        }

        try {
          const next = await Location.watchHeadingAsync(handleSample);
          // The await can resolve *after* cleanup ran, on a fast tab switch.
          // Without this the magnetometer stays live for the rest of the
          // session with nothing listening to it.
          if (cancelled) {
            next.remove();
            return;
          }
          subscription = next;

          // The backstop that actually catches the iOS Simulator, which
          // reports a magnetometer and then never emits a single heading.
          firstSampleTimer = setTimeout(() => {
            if (!cancelled && smoothedRef.current == null) setState(UNSUPPORTED);
          }, FIRST_SAMPLE_TIMEOUT_MS);
        } catch {
          if (!cancelled) setState(UNSUPPORTED);
        }
      })();

      return () => {
        cancelled = true;
        if (firstSampleTimer) clearTimeout(firstSampleTimer);
        subscription?.remove();
        subscription = null;
      };
    }, [enabled, appActive, locationStatus])
  );

  return state;
}
