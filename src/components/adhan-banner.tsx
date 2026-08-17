import { Volume2 } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_SPACE } from '@/components/floating-tab-bar';
import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '@/lib/use-color-scheme';

type AdhanBannerProps = {
  /** The prayer being called, e.g. `Maghrib`. */
  label: string;
  onStop: () => void;
};

/** Matches the tab bar's own edge inset so the two pills line up. */
const SCREEN_PADDING = 20;
/** The tab bar's fallback gap when there is no bottom safe area. */
const BAR_OFFSET = 12;

/**
 * The only way to stop a 3:45 recording that the app started on its own.
 *
 * Floats directly above the tab bar rather than living on the home screen: the
 * adhan plays whichever tab is open, so its stop control has to be reachable
 * from all of them.
 */
export function AdhanBanner({ label, onStop }: AdhanBannerProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: (insets.bottom || BAR_OFFSET) + TAB_BAR_SPACE + 8,
        paddingHorizontal: SCREEN_PADDING,
      }}>
      <NativeOnlyAnimatedView
        entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutDown.duration(200).reduceMotion(ReduceMotion.System)}>
        <View
          className="border-border bg-card flex-row items-center gap-3 rounded-full border py-2 pl-4 pr-2"
          style={Platform.select({
            android: { elevation: 12 },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: colorScheme === 'dark' ? 0.5 : 0.14,
              shadowRadius: 20,
            },
          })}>
          <Icon as={Volume2} className="text-primary size-5" />
          <Text className="flex-1 font-medium" numberOfLines={1}>
            {label} · adhan
          </Text>
          <Pressable
            onPress={onStop}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Stop the ${label} adhan`}
            className="bg-primary/15 active:opacity-60 rounded-full px-4 py-2">
            <Text className="text-primary text-sm font-semibold">Stop</Text>
          </Pressable>
        </View>
      </NativeOnlyAnimatedView>
    </View>
  );
}
