import * as React from 'react';

import type { City } from '@/lib/cities';
import {
  getSnapshot,
  initLocation,
  refreshLocation,
  requestLocationPermission,
  setManualCity,
  subscribe,
  useDeviceLocation as revertToDeviceLocation,
  type LocationSnapshot,
} from '@/lib/location-store';

export type UseLocationResult = LocationSnapshot & {
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
  setCity: (city: City) => Promise<void>;
  useDeviceLocation: () => Promise<void>;
};

export function useLocation(): UseLocationResult {
  // The third argument is the server snapshot, required for the static web
  // output this app builds.
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    initLocation();
  }, []);

  return {
    ...snapshot,
    requestPermission: requestLocationPermission,
    refresh: refreshLocation,
    setCity: setManualCity,
    useDeviceLocation: revertToDeviceLocation,
  };
}
