import * as React from 'react';
import { Linking, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/city-picker';
import { TAB_BAR_SPACE } from '@/components/floating-tab-bar';
import { LocationPromptCard } from '@/components/home/location-prompt-card';
import { QiblaDial } from '@/components/qibla/qibla-dial';
import { QiblaHeader } from '@/components/qibla/qibla-header';
import { QiblaHintCard, type QiblaHintKind } from '@/components/qibla/qibla-hint-card';
import { QiblaReadout } from '@/components/qibla/qibla-readout';
import { QiblaSkeleton } from '@/components/qibla/qibla-skeleton';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { useQibla } from '@/hooks/use-qibla';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

/** Matches BAR_MARGIN in floating-tab-bar.tsx so content shares the pill's edge. */
const SCREEN_PADDING = 20;
/** Above this the dial stops growing and just centres on larger screens. */
const MAX_DIAL_SIZE = 320;

export default function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();
  const qibla = useQibla();

  const [cityPickerOpen, setCityPickerOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Sized in px from the window: percentage heights collapse under a
  // content-sized ancestor in React Native.
  const dialSize = Math.min(width - SCREEN_PADDING * 2, MAX_DIAL_SIZE);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await qibla.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * At most one hint at a time, in priority order. Stacking them would be a
   * wall of nagging that teaches the user to ignore all of them, and the dial
   * keeps working through every one -- none of these is an error.
   */
  const hint: QiblaHintKind | null =
    qibla.state === 'no-compass'
      ? // A missing permission and a missing magnetometer look identical on
        // screen -- a static dial -- but only one of them the user can fix.
        qibla.headingStatus === 'unauthorized'
        ? 'compass-permission'
        : 'no-compass'
      : qibla.state !== 'ready'
        ? null
        : qibla.calibration === 'unusable'
          ? 'calibrate'
          : !qibla.isTrueNorth && qibla.heading != null
            ? 'magnetic'
            : qibla.tilt.available && !qibla.tilt.isFlat
              ? 'lay-flat'
              : qibla.location?.source === 'manual'
                ? 'manual-city'
                : null;

  return (
    <>
      <View className="flex-1">
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
          // No background class anywhere: the MeshGradientBackground mounted in
          // (tabs)/_layout.tsx has to stay visible through this screen.
          contentContainerStyle={{
            // The tabs group hides the header, so the top inset is ours.
            paddingTop: insets.top + 12,
            // TAB_BAR_SPACE excludes the safe area by definition, hence both.
            paddingBottom: TAB_BAR_SPACE + insets.bottom + 24,
            paddingHorizontal: SCREEN_PADDING,
            gap: 16,
          }}>
          <QiblaHeader
            location={qibla.location}
            status={qibla.locationStatus}
            onPressLocation={() => setCityPickerOpen(true)}
          />

          {qibla.state === 'loading' ? (
            <QiblaSkeleton size={dialSize} />
          ) : qibla.state === 'needs-location' || qibla.bearing == null ? (
            <LocationPromptCard
              status={qibla.locationStatus}
              canAskAgain={qibla.canAskAgain}
              onEnable={() => void qibla.requestPermission()}
              onChooseCity={() => setCityPickerOpen(true)}
            />
          ) : (
            <>
              <NativeOnlyAnimatedView
                entering={FadeInDown.duration(340).reduceMotion(ReduceMotion.System)}>
                <View className="items-center gap-6 pt-2">
                  <QiblaDial
                    size={dialSize}
                    bearing={qibla.bearing}
                    heading={qibla.heading}
                    isAligned={qibla.isAligned}
                  />

                  <QiblaReadout
                    bearing={qibla.bearing}
                    distanceKm={qibla.distanceKm ?? 0}
                    alignmentError={qibla.alignmentError}
                    isAligned={qibla.isAligned}
                  />
                </View>
              </NativeOnlyAnimatedView>

              {hint ? (
                <QiblaHintCard
                  kind={hint}
                  action={
                    hint === 'compass-permission'
                      ? {
                          // Routed through the location store rather than
                          // prompting here, so there is still only one owner of
                          // the permission dialog.
                          label: qibla.canAskAgain ? 'Allow location' : 'Open settings',
                          onPress: () =>
                            qibla.canAskAgain
                              ? void qibla.requestPermission()
                              : void Linking.openSettings(),
                        }
                      : undefined
                  }
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </View>

      <CityPicker
        open={cityPickerOpen}
        onOpenChange={setCityPickerOpen}
        canUseDeviceLocation={qibla.locationStatus !== 'denied'}
        onSelect={(city) => {
          void qibla.setCity(city);
          setCityPickerOpen(false);
        }}
        onUseDeviceLocation={() => {
          void qibla.useDeviceLocation();
          setCityPickerOpen(false);
        }}
      />
    </>
  );
}
