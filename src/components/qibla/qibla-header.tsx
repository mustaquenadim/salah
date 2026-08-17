import { LocateFixed, LocateOff } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LocationStatus, ResolvedLocation } from '@/lib/location-store';

type QiblaHeaderProps = {
  location: ResolvedLocation | null;
  status: LocationStatus;
  onPressLocation: () => void;
};

/**
 * Title, the place the bearing is measured from, and the theme toggle.
 *
 * The location pill matches the home header's exactly -- same shape, same
 * affordance, same tap target -- because it does the same job and opens the
 * same picker. Which city the Qibla is computed from matters more here than it
 * does for prayer times, so it stays visible in every state.
 */
export function QiblaHeader({ location, status, onPressLocation }: QiblaHeaderProps) {
  const locationOff = status === 'denied' || status === 'disabled';
  const placeName = location?.city ?? (status === 'resolving' ? 'Finding you…' : 'Set location');
  const label = locationOff && !location ? 'Location off' : placeName;

  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text variant="h3">Qibla</Text>

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
      </View>

      <ThemeToggle />
    </View>
  );
}
