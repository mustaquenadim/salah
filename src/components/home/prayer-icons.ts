import {
  CloudSun,
  MoonStar,
  Sun,
  SunMedium,
  Sunrise,
  Sunset,
  type LucideIcon,
} from 'lucide-react-native';

import type { PrayerName } from '@/lib/prayer-times';

/**
 * Lucide throughout for the prayer glyphs: they read as one visual family, and
 * the Hugeicons free set has no sunrise/sunset. Hugeicons stays the family for
 * structural and navigation icons, matching the tab bar.
 */
export const PRAYER_ICONS: Record<PrayerName, LucideIcon> = {
  fajr: Sunrise,
  sunrise: SunMedium,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: MoonStar,
};
