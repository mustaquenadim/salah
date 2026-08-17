import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { TAB_BAR_SPACE } from '@/components/floating-tab-bar';
import { BeadSkinRow } from '@/components/tasbih/bead-skin-row';
import { BeadStrand } from '@/components/tasbih/bead-strand';
import { DhikrCard } from '@/components/tasbih/dhikr-card';
import { DhikrPicker } from '@/components/tasbih/dhikr-picker';
import { TargetPicker } from '@/components/tasbih/target-picker';
import { TasbihCounter } from '@/components/tasbih/tasbih-counter';
import { TasbihHeader } from '@/components/tasbih/tasbih-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { useTasbih } from '@/hooks/use-tasbih';

/** Matches BAR_MARGIN in floating-tab-bar.tsx so cards share the pill's edge. */
const SCREEN_PADDING = 20;

/** How far a swipe must travel left before it counts as an undo. */
const UNDO_DISTANCE = 60;

export default function TasbihScreen() {
  const insets = useSafeAreaInsets();
  const tasbih = useTasbih();

  const [dhikrPickerOpen, setDhikrPickerOpen] = React.useState(false);
  const [targetPickerOpen, setTargetPickerOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  const { tap, back } = tasbih;

  const countGesture = React.useMemo(() => {
    const count = Gesture.Tap()
      .maxDuration(400)
      .onEnd((_event, success) => {
        if (success) scheduleOnRN(tap);
      });

    /*
     * Right to left only, as the hint on screen says. `activeOffsetX` keeps the
     * pan from ever claiming a rightward drag, and `failOffsetY` releases it as
     * soon as the movement is mostly vertical -- without which the pan would
     * swallow a downward drag that belongs to nothing else on this screen but
     * still feels stuck.
     */
    const undo = Gesture.Pan()
      .activeOffsetX(-24)
      .failOffsetY([-20, 20])
      .onEnd((event) => {
        if (event.translationX < -UNDO_DISTANCE) scheduleOnRN(back);
      });

    // Race rather than Simultaneous: one motion must not both count and undo.
    return Gesture.Race(undo, count);
  }, [tap, back]);

  return (
    <>
      {/* No background of its own: MeshGradientBackground is mounted in
          (tabs)/_layout.tsx and has to stay visible through this screen. */}
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
        <TasbihHeader
          hapticsEnabled={tasbih.hapticsEnabled}
          onToggleHaptics={tasbih.toggleHaptics}
          onReset={() => setResetOpen(true)}
        />

        {/* "Tap anywhere" is everything between the header and the bottom
            cluster, so the buttons in both stay reachable.
            `collapsable={false}` is load-bearing, not cosmetic: this View
            carries no props that force a native node, so Android's view
            flattening would remove it and leave the GestureDetector with
            nothing to attach to. */}
        {/* Grouped tight and centred as one block rather than spread down the
            surface: `justify-center` on its own would let a tall screen open
            large empty bands between the count, the strand and the hint, and
            the three read as one instrument only while they stay together. */}
        <GestureDetector gesture={countGesture}>
          <View collapsable={false} className="flex-1 justify-center gap-2">
            <NativeOnlyAnimatedView
              entering={FadeInDown.duration(340).reduceMotion(ReduceMotion.System)}>
              <TasbihCounter
                count={tasbih.count}
                loops={tasbih.loops}
                target={tasbih.target}
                onPressTarget={() => setTargetPickerOpen(true)}
              />
            </NativeOnlyAnimatedView>

            <BeadStrand strokes={tasbih.strokes} skin={tasbih.beadSkin} />

            <Text className="text-muted-foreground px-8 text-center text-sm">
              {tasbih.strokes === 0 ? 'Tap anywhere to begin' : 'Tap anywhere to count'}
              {'\n'}
              (right-left swipe will decrease count)
            </Text>
          </View>
        </GestureDetector>

        <NativeOnlyAnimatedView
          entering={FadeInDown.duration(340).delay(80).reduceMotion(ReduceMotion.System)}>
          <View
            style={{
              paddingHorizontal: SCREEN_PADDING,
              // TAB_BAR_SPACE excludes the safe area by definition, hence both
              // terms. The AdhanBanner floats in this same band while it plays;
              // that overlap is transient and dismissible, and reserving
              // permanent space for it would cost this screen a card's height
              // for the sake of a minute a day.
              paddingBottom: TAB_BAR_SPACE + insets.bottom + 12,
              gap: 12,
            }}>
            <DhikrCard dhikr={tasbih.dhikr} onPress={() => setDhikrPickerOpen(true)} />
            <BeadSkinRow value={tasbih.beadSkin} onChange={tasbih.setBeadSkin} />
          </View>
        </NativeOnlyAnimatedView>
      </View>

      <DhikrPicker
        open={dhikrPickerOpen}
        onOpenChange={setDhikrPickerOpen}
        selectedId={tasbih.dhikrId}
        onSelect={(dhikr) => {
          tasbih.setDhikr(dhikr.id);
          setDhikrPickerOpen(false);
        }}
      />

      <TargetPicker
        open={targetPickerOpen}
        onOpenChange={setTargetPickerOpen}
        target={tasbih.target}
        onChange={tasbih.setTarget}
      />

      {/* Confirmed rather than immediate: reset discards the loop count, which
          may be the record of a long session, and there is no undo for it. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the count?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the current count and every completed loop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={tasbih.reset}>
              <Text>Reset</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
