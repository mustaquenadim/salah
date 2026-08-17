import * as Haptics from 'expo-haptics';
import * as React from 'react';

import { useDeviceTilt, type DeviceTilt } from '@/hooks/use-device-tilt';
import { useHeading, type CompassCalibration, type HeadingStatus } from '@/hooks/use-heading';
import { useLocation } from '@/hooks/use-location';
import type { City } from '@/lib/cities';
import type { LocationStatus, ResolvedLocation } from '@/lib/location-store';
import { qiblaBearing, qiblaDistanceKm } from '@/lib/qibla';

export type QiblaState =
  | 'loading'
  | 'needs-location'
  /**
   * Located, but nothing is tracking which way the phone points -- no
   * magnetometer, or no permission to read one. Either way the dial goes
   * static; `headingStatus` says which, so the hint can tell the truth.
   */
  | 'no-compass'
  | 'ready';

export type UseQiblaResult = {
  state: QiblaState;
  location: ResolvedLocation | null;
  locationStatus: LocationStatus;
  canAskAgain: boolean;
  isStale: boolean;
  /** Degrees clockwise from true north. Null until a location resolves. */
  bearing: number | null;
  distanceKm: number | null;
  /** Live device heading in [0, 360), or null with no compass. */
  heading: number | null;
  headingStatus: HeadingStatus;
  /** Signed offset to the Qibla; positive means turn right. */
  alignmentError: number | null;
  isAligned: boolean;
  calibration: CompassCalibration;
  isTrueNorth: boolean;
  tilt: DeviceTilt;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
  setCity: (city: City) => Promise<void>;
  useDeviceLocation: () => Promise<void>;
};

/**
 * Everything the Qibla screen needs, composed from the shared location store,
 * the compass and the motion sensor.
 *
 * Reuses `useLocation` rather than starting its own permission flow -- the
 * store is a module singleton precisely so two screens cannot each prompt.
 *
 * @example
 * ```tsx
 * const qibla = useQibla();
 * if (qibla.state === 'ready') {
 *   return <QiblaDial bearing={qibla.bearing!} heading={qibla.heading} isAligned={qibla.isAligned} />;
 * }
 * ```
 */
export function useQibla(): UseQiblaResult {
  const location = useLocation();
  const coords = location.location;

  const bearing = React.useMemo(() => (coords ? qiblaBearing(coords) : null), [coords]);
  const distance = React.useMemo(() => (coords ? qiblaDistanceKm(coords) : null), [coords]);

  // No point spinning up sensors before there is a bearing to compare against.
  const sensorsEnabled = coords != null;
  // Alignment is computed inside the compass hook, in the sample handler, so
  // heading and alignment always describe the same instant.
  const compass = useHeading(sensorsEnabled, bearing, location.status);
  const tilt = useDeviceTilt(sensorsEnabled);

  // Keyed on the boolean rather than the error, so it fires exactly once per
  // false->true transition instead of on every frame inside the band. The
  // calibration gate means we do not buzz to confirm a lock-on we do not
  // ourselves believe.
  const shouldCelebrate = compass.isAligned && compass.calibration !== 'unusable';

  React.useEffect(() => {
    if (!shouldCelebrate) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [shouldCelebrate]);

  const state: QiblaState = !coords
    ? location.status === 'idle' || location.status === 'resolving'
      ? 'loading'
      : 'needs-location'
    : compass.status === 'unsupported' || compass.status === 'unauthorized'
      ? 'no-compass'
      : 'ready';

  return {
    state,
    location: coords,
    locationStatus: location.status,
    canAskAgain: location.canAskAgain,
    isStale: location.isStale,
    bearing,
    distanceKm: distance,
    heading: compass.heading,
    headingStatus: compass.status,
    alignmentError: compass.alignmentError,
    isAligned: compass.isAligned,
    calibration: compass.calibration,
    isTrueNorth: compass.isTrueNorth,
    tilt,
    requestPermission: location.requestPermission,
    refresh: location.refresh,
    setCity: location.setCity,
    useDeviceLocation: location.useDeviceLocation,
  };
}
