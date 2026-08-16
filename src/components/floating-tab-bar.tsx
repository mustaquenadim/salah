import Compass01Icon from '@hugeicons/core-free-icons/Compass01Icon';
import Home01Icon from '@hugeicons/core-free-icons/Home01Icon';
import Quran01Icon from '@hugeicons/core-free-icons/Quran01Icon';
import TasbihIcon from '@hugeicons/core-free-icons/TasbihIcon';
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon';
import type { IconSvgElement } from '@hugeicons/react-native';
import type { Href } from 'expo-router';
import { useTabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import * as React from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

type TabDefinition = {
  /** Trigger name -- must match the `name` given to the matching `TabTrigger`. */
  name: string;
  href: Href;
  icon: IconSvgElement;
  label: string;
};

/**
 * Single source of truth for the bar: `(tabs)/_layout.tsx` maps over this to
 * render the triggers, and the bar itself maps over it to place the indicator.
 * Order here is the order on screen.
 */
export const TABS: readonly TabDefinition[] = [
  // `typedRoutes` enumerates the group's index route as `/index` and omits the
  // `/` it resolves to, so the root href needs the cast.
  { name: 'home', href: '/' as Href, icon: Home01Icon, label: 'Home' },
  { name: 'qibla', href: '/qibla', icon: Compass01Icon, label: 'Qibla' },
  { name: 'quran', href: '/quran', icon: Quran01Icon, label: 'Quran' },
  { name: 'tasbih', href: '/tasbih', icon: TasbihIcon, label: 'Tasbih' },
  { name: 'profile', href: '/profile', icon: UserCircleIcon, label: 'Profile' },
];

/** Height of the pill itself, excluding the gap below it and the safe area. */
const BAR_HEIGHT = 60;
/** Padding between the pill's edge and the slot row inside it. */
const BAR_PADDING = 6;
/** Diameter of the circle that slides behind the focused icon. */
const INDICATOR_SIZE = BAR_HEIGHT - BAR_PADDING * 2;
/** Gap between the pill and the bottom safe area (or screen edge). */
const BAR_OFFSET = 12;
/** Horizontal inset from the screen edge to the pill. */
const BAR_MARGIN = 20;

/**
 * Vertical space the floating bar occupies, excluding the bottom safe area.
 * Scrollable screens should add this plus `useSafeAreaInsets().bottom` to their
 * content padding so the last item clears the pill.
 */
export const TAB_BAR_SPACE = BAR_HEIGHT + BAR_OFFSET;

const INDICATOR_SPRING = { damping: 18, stiffness: 220, mass: 0.6 } as const;

/**
 * The floating pill tab bar. Renders as the child of `<TabList asChild>`, so it
 * receives the `TabTrigger` elements as `children` and lays them out in evenly
 * sized slots with an emerald circle that springs between them.
 *
 * Focus is read from the router rather than from the buttons, which keeps the
 * indicator and the icon tint driven by the same source.
 *
 * @example
 * ```tsx
 * <TabList asChild>
 *   <FloatingTabBar>
 *     {TABS.map((tab) => (
 *       <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
 *         <FloatingTabBarButton icon={tab.icon} label={tab.label} />
 *       </TabTrigger>
 *     ))}
 *   </FloatingTabBar>
 * </TabList>
 * ```
 */
export function FloatingTabBar({ children }: { children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { getTrigger } = useTabTrigger({ name: TABS[0].name });

  const [rowWidth, setRowWidth] = React.useState(0);
  const translateX = useSharedValue(0);
  // Doubles as the indicator's opacity so it does not flash at x=0 before the
  // first layout pass reports a width.
  const isPlaced = useSharedValue(0);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => getTrigger(tab.name)?.isFocused)
  );
  const slotWidth = rowWidth / TABS.length;
  const target = slotWidth * activeIndex + (slotWidth - INDICATOR_SIZE) / 2;

  React.useEffect(() => {
    if (slotWidth === 0) return;
    if (isPlaced.value === 0) {
      // Land in place on first measure; only later tab changes animate.
      translateX.value = target;
      isPlaced.value = 1;
      return;
    }
    translateX.value = withSpring(target, INDICATOR_SPRING);
  }, [target, slotWidth, translateX, isPlaced]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: isPlaced.value,
    transform: [{ translateX: translateX.value }],
  }));

  function handleRowLayout(event: LayoutChangeEvent) {
    setRowWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      pointerEvents="box-none"
      className="items-center"
      // Positioned inline, not with `absolute inset-x-0`: Tailwind v4 compiles
      // `inset-x-*` to the logical `inset-inline`, which uniwind passes through
      // untranslated and RN then ignores -- leaving the bar at auto width.
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: BAR_MARGIN,
        paddingBottom: (insets.bottom || BAR_OFFSET) + BAR_OFFSET,
      }}>
      <View
        className="border-border bg-card w-full rounded-full border"
        style={{
          maxWidth: 520,
          padding: BAR_PADDING,
          ...Platform.select({
            android: { elevation: 12 },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: colorScheme === 'dark' ? 0.5 : 0.14,
              shadowRadius: 20,
            },
          }),
        }}>
        <View onLayout={handleRowLayout} className="flex-row items-center">
          {/* Styled inline rather than with `className`: uniwind's class runtime
              and Reanimated's style updates should not both own this node. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                height: INDICATOR_SIZE,
                width: INDICATOR_SIZE,
                ...Platform.select({
                  android: { elevation: 6 },
                  default: {
                    shadowColor: THEME[colorScheme].primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: colorScheme === 'dark' ? 0.55 : 0.3,
                    shadowRadius: 12,
                  },
                }),
              },
              indicatorStyle,
            ]}>
            <View className="bg-primary/15 border-primary/25 size-full rounded-full border" />
          </Animated.View>
          {children}
        </View>
      </View>
    </View>
  );
}

type FloatingTabBarButtonProps = TabTriggerSlotProps & {
  icon: IconSvgElement;
  /** Not rendered -- the bar is icons only -- but read out by screen readers. */
  label: string;
};

/**
 * A single slot in {@link FloatingTabBar}. Renders as the child of
 * `<TabTrigger asChild>`, which supplies `isFocused`, `onPress` and
 * `onLongPress`.
 */
export function FloatingTabBarButton({
  icon,
  label,
  isFocused,
  // `TabTrigger` injects a row style meant for its default `Pressable`; the
  // slot sizing here comes from `className` instead.
  style: _style,
  ...props
}: FloatingTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      className="flex-1 items-center justify-center"
      style={{ height: INDICATOR_SIZE }}>
      <Icon
        as={icon}
        strokeWidth={isFocused ? 2 : 1.5}
        className={isFocused ? 'text-primary size-6' : 'text-muted-foreground size-6'}
      />
    </Pressable>
  );
}
