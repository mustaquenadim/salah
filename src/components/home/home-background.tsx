import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

const HOME_BG = require('@/assets/images/home-bg.png');

/**
 * Vertical scrim, as `[offset, opacity]` pairs painted in the theme's
 * `background` colour over the photo.
 *
 * The photo is a dusk shot -- dark, saturated, and bright in the top right where
 * the theme toggle sits -- so it cannot carry the screen's text on its own. Each
 * scheme is tuned to the same job: hold `foreground` and `muted-foreground` at
 * their designed contrast wherever text lands, and let the mosque show through
 * everywhere else.
 *
 * The stops are strongest at the very top (the header block, the only text with
 * no card behind it) and at the very bottom (below the last card, where the
 * photo is nearly black and the content should read as ending).
 */
const SCRIM: Record<'light' | 'dark', readonly (readonly [number, number])[]> = {
  // A light theme over a dark photo is the hard case: the wash has to be heavy
  // enough for near-black text, which leaves the mosque as a watermark rather
  // than as the subject. That is the trade, not a mistake -- dark mode is where
  // this image is meant to be seen.
  light: [
    [0, 0.9],
    [0.18, 0.84],
    [0.55, 0.82],
    [1, 0.93],
  ],
  dark: [
    [0, 0.55],
    [0.18, 0.38],
    [0.55, 0.34],
    [1, 0.72],
  ],
};

/**
 * Full-bleed photographic backdrop for the home screen.
 *
 * Sits over the app-wide {@link MeshGradientBackground} rather than replacing
 * it: the gradient stays the base every other tab paints on, and it is also what
 * shows for the frame or two before the image decodes.
 *
 * Render it as the first child of the screen's flex container and let the
 * scroll view paint over it -- it fills its parent and takes no touches.
 *
 * @example
 * ```tsx
 * <View className="flex-1">
 *   <HomeBackground />
 *   <ScrollView>{...}</ScrollView>
 * </View>
 * ```
 */
export function HomeBackground() {
  const { colorScheme } = useColorScheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={HOME_BG}
        style={StyleSheet.absoluteFill}
        // The asset is 19.5:9, so on a phone `cover` is very close to a 1:1 map.
        // Anchoring to the top is what matters on anything wider, where cover
        // crops vertically: it keeps the mosque on screen and eats the water.
        contentFit="cover"
        contentPosition="top"
        cachePolicy="memory-disk"
        priority="high"
        // Decorative. Naming it would make every screen reader announce the
        // wallpaper before the prayer times.
        accessible={false}
      />

      {/* `absoluteFill` positions the element but leaves the SVG viewport at its
          own default size, so the dimensions have to be stated as well. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="home-scrim" x1="0" y1="0" x2="0" y2="1">
            {SCRIM[colorScheme].map(([offset, opacity]) => (
              <Stop
                key={offset}
                offset={offset}
                stopColor={THEME[colorScheme].background}
                stopOpacity={opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#home-scrim)" />
      </Svg>
    </View>
  );
}
