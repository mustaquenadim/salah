import * as React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/city-picker';
import { TAB_BAR_SPACE } from '@/components/floating-tab-bar';
import { HomeHeader } from '@/components/home/home-header';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { LocationPromptCard } from '@/components/home/location-prompt-card';
import { NextPrayerHero } from '@/components/home/next-prayer-hero';
import { PrayerList } from '@/components/home/prayer-list';
import { PrayerMethodPicker } from '@/components/prayer-method-picker';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

/** Matches BAR_MARGIN in floating-tab-bar.tsx so cards share the pill's edge. */
const SCREEN_PADDING = 20;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const home = usePrayerTimes();

  const [cityPickerOpen, setCityPickerOpen] = React.useState(false);
  const [methodPickerOpen, setMethodPickerOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await home.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME[colorScheme].mutedForeground}
            colors={[THEME[colorScheme].primary]}
          />
        }
        // No background class anywhere on this screen: the MeshGradientBackground
        // mounted in (tabs)/_layout.tsx paints behind TabSlot and has to stay
        // visible. ScrollView is transparent by default, so this just means not
        // overriding it.
        contentContainerStyle={{
          // The tabs group hides the header, so the top inset is ours to apply.
          paddingTop: insets.top + 12,
          // TAB_BAR_SPACE excludes the safe area by definition, hence both terms.
          paddingBottom: TAB_BAR_SPACE + insets.bottom + 24,
          paddingHorizontal: SCREEN_PADDING,
          gap: 16,
        }}>
        <HomeHeader
          day={home.day}
          hijriDayOffset={home.settings.hijriDayOffset}
          location={home.location}
          status={home.locationStatus}
          isStale={home.isStale}
          onPressLocation={() => setCityPickerOpen(true)}
        />

        {home.state === 'loading' ? (
          <HomeSkeleton />
        ) : home.state === 'needs-location' || !home.timeline ? (
          <LocationPromptCard
            status={home.locationStatus}
            canAskAgain={home.canAskAgain}
            onEnable={() => void home.requestPermission()}
            onChooseCity={() => setCityPickerOpen(true)}
          />
        ) : (
          <>
            <NextPrayerHero timeline={home.timeline} use24h={home.use24h} />
            <PrayerList
              timeline={home.timeline}
              use24h={home.use24h}
              methodLabel={home.methodLabel}
              onPressMethod={() => setMethodPickerOpen(true)}
            />
          </>
        )}
      </ScrollView>

      <CityPicker
        open={cityPickerOpen}
        onOpenChange={setCityPickerOpen}
        canUseDeviceLocation={home.locationStatus !== 'denied'}
        onSelect={(city) => {
          void home.setCity(city);
          setCityPickerOpen(false);
        }}
        onUseDeviceLocation={() => {
          void home.useDeviceLocation();
          setCityPickerOpen(false);
        }}
      />

      <PrayerMethodPicker
        open={methodPickerOpen}
        onOpenChange={setMethodPickerOpen}
        settings={home.settings}
        onChange={home.updateSettings}
      />
    </>
  );
}
