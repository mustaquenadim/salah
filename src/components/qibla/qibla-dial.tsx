import Kaaba01Icon from '@hugeicons/core-free-icons/Kaaba01Icon';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import {
  alignmentErrorDegrees,
  describeAlignment,
  describeBearing,
  polarToCartesian,
  unwrapDegrees,
} from '@/lib/qibla';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

type QiblaDialProps = {
  /** Diameter in px. Sized by the caller from the window width. */
  size: number;
  /** Qibla bearing, degrees clockwise from true north. */
  bearing: number;
  /** Live heading, or null to render the static fallback dial with north up. */
  heading: number | null;
  isAligned: boolean;
};

/** Matches INDICATOR_SPRING in floating-tab-bar.tsx -- one motion feel app-wide. */
const DIAL_SPRING = {
  damping: 18,
  stiffness: 220,
  mass: 0.6,
  // With Reduce Motion on this lands on the target immediately, which for a
  // compass is both the accessible behaviour and the more useful one.
  reduceMotion: ReduceMotion.System,
} as const;

const CARDINALS = [
  { label: 'N', bearing: 0 },
  { label: 'E', bearing: 90 },
  { label: 'S', bearing: 180 },
  { label: 'W', bearing: 270 },
] as const;

const LABEL_SIZE = 15;
const GLYPH_SIZE = 32;
/** Height of the fixed pointer above the ring. */
const MARKER_HEIGHT = 16;

/**
 * The rotating compass rose.
 *
 * The whole dial -- ticks, cardinal letters, and the Kaaba glyph sitting at the
 * Qibla bearing -- turns under a fixed marker at twelve o'clock, the way a
 * physical compass does. The user turns their body until the Kaaba reaches the
 * marker.
 *
 * With `heading` null this degrades to a static bearing dial: north stays up
 * and the glyph shows which way the Qibla lies relative to it. That is the
 * honest thing to show on a device with no magnetometer -- a live-looking
 * compass that never moves reads as broken.
 *
 * @example
 * ```tsx
 * <QiblaDial size={320} bearing={118.4} heading={compass.heading} isAligned={isAligned} />
 * ```
 */
export function QiblaDial({ size, bearing, heading, isAligned }: QiblaDialProps) {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme];

  const centre = size / 2;
  const outer = size / 2 - 4;

  const rotation = useSharedValue(0);
  /*
   * A JS mirror of the animation's target, deliberately not read back from
   * `rotation.value`. Reading the shared value returns wherever the spring has
   * got to *right now*, not the last target, so unwrapping against it would
   * make the target itself jitter -- and a `.value` read in a render body is
   * the impurity the React Compiler is hazardous around.
   */
  const continuousRef = React.useRef(0);

  React.useEffect(() => {
    if (heading == null) {
      rotation.value = 0;
      continuousRef.current = 0;
      return;
    }
    // The accumulator is unbounded on purpose: `unwrapDegrees` picks whichever
    // congruent target is nearest, so crossing 359° -> 0° is a 1° move rather
    // than a 359° sweep the other way.
    const next = unwrapDegrees(-heading, continuousRef.current);
    continuousRef.current = next;
    rotation.value = withSpring(next, DIAL_SPRING);
  }, [heading, rotation]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ticks = React.useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const tickBearing = index * 6;
        const isCardinal = tickBearing % 90 === 0;
        const isMajor = tickBearing % 30 === 0;
        const length = isCardinal ? 16 : isMajor ? 12 : 7;
        const from = polarToCartesian(centre, centre, outer, tickBearing);
        const to = polarToCartesian(centre, centre, outer - length, tickBearing);
        return { key: tickBearing, from, to, isCardinal, isMajor };
      }),
    [centre, outer]
  );

  const labels = React.useMemo(
    () =>
      CARDINALS.map((cardinal) => ({
        ...cardinal,
        point: polarToCartesian(centre, centre, outer - 34, cardinal.bearing),
      })),
    [centre, outer]
  );

  // Fixed in the dial's own frame -- the glyph never moves, the dial does --
  // so this stays out of the animation path entirely.
  const glyph = React.useMemo(
    () => polarToCartesian(centre, centre, outer - 52, bearing),
    [centre, outer, bearing]
  );

  const alignedColor = isAligned ? theme.highlight : theme.primary;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        heading == null
          ? `Qibla is ${Math.round(bearing)} degrees, ${describeBearing(bearing)} of true north.`
          : // Through `alignmentErrorDegrees`, not a raw subtraction: facing 359
            // with the Qibla at 5 is a 6 degree turn to the right, and the bare
            // difference of -354 would send the listener the long way round.
            `Compass. Qibla is ${Math.round(bearing)} degrees. ${describeAlignment(
              alignmentErrorDegrees(bearing, heading),
              isAligned
            )}.`
      }
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* No className on this node: Reanimated owns its style. Everything the
          dial needs is either an inline style or an SVG prop. */}
      <Animated.View style={[{ width: size, height: size }, dialStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={centre}
            cy={centre}
            r={outer}
            stroke={theme.border}
            strokeWidth={1.5}
            fill="none"
          />

          {ticks.map((tick) => (
            <Line
              key={tick.key}
              x1={tick.from.x}
              y1={tick.from.y}
              x2={tick.to.x}
              y2={tick.to.y}
              stroke={tick.isCardinal ? theme.foreground : theme.mutedForeground}
              strokeOpacity={tick.isCardinal ? 0.9 : tick.isMajor ? 0.55 : 0.3}
              strokeWidth={tick.isCardinal ? 2 : tick.isMajor ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}

          {labels.map((label) => (
            <SvgText
              key={label.label}
              x={label.point.x}
              y={label.point.y}
              // `dy`, not `alignmentBaseline`: react-native-svg's baseline
              // support is inconsistent on Android and the letters sit high.
              dy={LABEL_SIZE * 0.35}
              textAnchor="middle"
              fontSize={LABEL_SIZE}
              fontFamily="Geist"
              fontWeight="600"
              fill={label.bearing === 0 ? theme.primary : theme.mutedForeground}>
              {label.label}
            </SvgText>
          ))}

          {/* Spoke from the centre to the Kaaba, so the direction reads even
              before the eye finds the glyph. */}
          <Line
            x1={centre}
            y1={centre}
            x2={glyph.x}
            y2={glyph.y}
            stroke={theme.highlight}
            strokeOpacity={isAligned ? 1 : 0.45}
            strokeWidth={isAligned ? 2.5 : 1.5}
            strokeLinecap="round"
          />

          <Circle cx={centre} cy={centre} r={3} fill={theme.mutedForeground} />
        </Svg>

        {/* Hugeicons mounts its own <Svg> root, so the glyph cannot live inside
            the dial's SVG -- and layout classes on <Icon> are dropped, only
            size-* and text-* survive. A wrapper View inside the same rotating
            parent is what keeps the glyph glued to the rose. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: glyph.x - GLYPH_SIZE / 2,
            top: glyph.y - GLYPH_SIZE / 2,
          }}>
          <Icon
            as={Kaaba01Icon}
            strokeWidth={isAligned ? 2 : 1.5}
            className={isAligned ? 'text-highlight size-8' : 'text-primary size-8'}
          />
        </View>
      </Animated.View>

      {/* Outside the rotating layer -- this is the thing the dial turns under.
          Positioned inline rather than with `inset-x-0`: Tailwind v4 compiles
          that to the logical `inset-inline`, which RN ignores. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center' }}>
        <Svg width={22} height={MARKER_HEIGHT}>
          <Polygon points={`11,${MARKER_HEIGHT} 0,0 22,0`} fill={alignedColor} />
        </Svg>
      </View>
    </View>
  );
}
