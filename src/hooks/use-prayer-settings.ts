import * as React from 'react';

import type { PrayerSettings } from '@/lib/prayer-settings';
import { getSnapshot, initSettings, subscribe, updateSettings } from '@/lib/settings-store';

export function usePrayerSettings(): readonly [
  PrayerSettings,
  (patch: Partial<PrayerSettings>) => void,
] {
  const settings = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    initSettings();
  }, []);

  return [settings, updateSettings] as const;
}
