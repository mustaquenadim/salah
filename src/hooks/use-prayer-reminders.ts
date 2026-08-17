import * as React from 'react';

import {
  getSnapshot,
  initReminders,
  subscribe,
  toggleReminder,
  type PrayerReminders,
} from '@/lib/reminder-store';
import type { PrayerName } from '@/lib/prayer-times';

export function usePrayerReminders(): readonly [PrayerReminders, (name: PrayerName) => void] {
  const reminders = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    initReminders();
  }, []);

  return [reminders, toggleReminder] as const;
}
