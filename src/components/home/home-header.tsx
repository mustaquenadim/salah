import { LocateFixed, LocateOff } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatGregorian } from '@/lib/date-format';
import { formatHijri } from '@/lib/hijri';
import type { LocationStatus, ResolvedLocation } from '@/lib/location-store';

type HomeHeaderProps = {
  day: Date;
  hijriDayOffset: number;
  location: ResolvedLocation | null;
  status: LocationStatus;
  isStale: boolean;
  onPressLocation: () => void;
};

/**
 * Date, place, and the theme toggle.
 *
 * The Hijri line is the largest thing here on purpose -- it is the app's
 * identity -- with the Gregorian date above it as the anchor a user
 * cross-checks against.
 */
export function HomeHeader({
  day,
  hijriDayOffset,
  location,
  status,
  isStale,
  onPressLocation,
}: HomeHeaderProps) {
  const locationOff = status === 'denied' || status === 'disabled';
  const placeName = location?.city ?? (status === 'resolving' ? 'Finding you…' : 'Set location');
  const label = locationOff && !location ? 'Location off' : placeName;

  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text variant="muted">{formatGregorian(day)}</Text>
        <Text variant="h3">{formatHijri(day, hijriDayOffset)}</Text>

        {/* The soft fill is what reads as tappable without making this a button. */}
        <Pressable
          onPress={onPressLocation}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${label}. Tap to change.`}
          className="bg-card/60 border-border/60 active:bg-card mt-1 flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1">
          <Icon
            as={locationOff ? LocateOff : LocateFixed}
            className="text-muted-foreground size-3.5"
          />
          <Text variant="small" className="text-muted-foreground">
            {label}
            {location?.source === 'manual' && location.countryCode
              ? ` · ${location.countryCode}`
              : ''}
          </Text>
        </Pressable>

        {isStale ? (
          <Text className="text-muted-foreground text-xs">Using your last known location</Text>
        ) : null}
      </View>

      <ThemeToggle />
    </View>
  );
}
