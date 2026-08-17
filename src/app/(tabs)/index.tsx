import * as React from 'react';
import { Alert, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/city-picker';
import { TAB_BAR_SPACE } from '@/components/floating-tab-bar';
import { HomeBackground } from '@/components/home/home-background';
import { HomeHeader } from '@/components/home/home-header';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { LocationPromptCard } from '@/components/home/location-prompt-card';
import { NextPrayerHero } from '@/components/home/next-prayer-hero';
import { PrayerList } from '@/components/home/prayer-list';
import { PrayerMethodPicker } from '@/components/prayer-method-picker';
import { usePrayerReminders } from '@/hooks/use-prayer-reminders';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { ensureNotificationPermission } from '@/lib/notifications';
import type { PrayerName } from '@/lib/prayer-times';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

/** Matches BAR_MARGIN in floating-tab-bar.tsx so cards share the pill's edge. */
const SCREEN_PADDING = 20;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const home = usePrayerTimes();
  // Kept out of usePrayerTimes: reminders are a notification preference and
  // never feed back into the times themselves.
  const [reminders, toggleReminder] = usePrayerReminders();

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

  /*
   * Permission is asked for at the moment it is needed -- switching on a first
   * reminder -- rather than on launch. Asking cold, before the user has shown
   * any interest in being called to prayer, is how apps get permanently denied.
   */
  async function applyReminderToggle(name: PrayerName) {
    if (reminders[name]) {
      toggleReminder(name);
      return;
    }

    if (await ensureNotificationPermission()) {
      toggleReminder(name);
      return;
    }

    // Left off rather than stored optimistically: a switch that is on while the
    // OS will deliver nothing is a lie about what the app is going to do.
    Alert.alert(
      'Notifications are off',
      'Salah needs permission to send notifications before it can call you to prayer.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]
    );
  }

  function handleToggleReminder(name: PrayerName) {
    void applyReminderToggle(name);
  }

  return (
    <>
      {/* HomeBackground is absolutely positioned, so it needs a sized parent --
          the fragment the screen used to return would have left it at zero. */}
      <View className="flex-1">
        <HomeBackground />

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
          // No background class anywhere on this screen: HomeBackground above --
          // and the MeshGradientBackground behind it, mounted in
          // (tabs)/_layout.tsx -- have to stay visible. ScrollView is
          // transparent by default, so this just means not overriding it.
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
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
              />
            </>
          )}
        </ScrollView>
      </View>

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
