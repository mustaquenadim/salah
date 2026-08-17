import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Bead } from '@/components/tasbih/bead';
import { buildStrandLut, sampleStrand, strandPathD, type StrandLut } from '@/lib/bead-path';
import { findBeadSkin, type BeadSkin, type BeadSkinId } from '@/lib/bead-skins';

/** Rendered bead diameter. */
const BEAD_SIZE = 40;
/**
 * Arc length between bead centres.
 *
 * Comfortably wider than a bead, so a length of cord shows between each pair.
 * At anything close to the diameter the beads read as one continuous tube --
 * the visible thread is most of what makes the strand legible as beads at all.
 */
const BEAD_GAP = 58;
/** Height of the strip the strand occupies. */
const STRAND_HEIGHT = 190;

/** Matches the tab bar indicator and the drawer settle, for one motion feel. */
const ADVANCE_SPRING = { damping: 18, stiffness: 220, mass: 0.6 } as const;

/**
 * Above this many beads of difference, the strand jumps instead of springing.
 *
 * Counting moves by one. Anything larger is a reset, a target change, or the
 * stored state arriving from disk -- none of which the user thinks of as the
 * beads travelling, so animating them across the whole strand would read as a
 * glitch rather than as motion.
 */
const JUMP_THRESHOLD = 2;

type BeadStrandProps = {
  /** Monotonic lifetime count. See `TasbihState.strokes`. */
  strokes: number;
  skin: BeadSkinId;
};

/**
 * The bead strand.
 *
 * Structure is a static SVG cord with a window of animated beads laid over it.
 * The SVG never animates; each bead is an `Animated.View` that resolves its own
 * position along the curve from one shared value, so a tap updates the UI
 * thread only -- the strand itself does not re-render.
 *
 * Beads recycle: their arc position wraps modulo the curve length, so a fixed
 * window of about a dozen covers an unbounded count.
 */
export function BeadStrand({ strokes, skin }: BeadStrandProps) {
  const { width } = useWindowDimensions();
  const material = findBeadSkin(skin);

  const lut = React.useMemo(() => buildStrandLut(width, STRAND_HEIGHT), [width]);
  const pathD = React.useMemo(() => strandPathD(width, STRAND_HEIGHT), [width]);

  // One extra so there is always a bead covering the seam at the wrap point.
  const beadCount = Math.ceil(lut.total / BEAD_GAP) + 1;

  /*
   * Driven by the monotonic stroke total rather than by `count`.
   *
   * At a loop boundary `count` snaps back to 1, and springing the strand
   * backwards through thirty-odd beads would look like the whole thing had come
   * apart. Counting strokes instead means the beads only ever travel one way,
   * which is also what a real misbaha does.
   */
  const progress = useSharedValue(strokes);

  React.useEffect(() => {
    const delta = Math.abs(strokes - progress.value);
    progress.value =
      delta > JUMP_THRESHOLD ? strokes : withSpring(strokes, ADVANCE_SPRING);
  }, [strokes, progress]);

  return (
    <View
      // Clipped at the screen edge: the curve deliberately overruns both sides
      // so beads enter and leave out of frame.
      style={{ height: STRAND_HEIGHT, overflow: 'hidden' }}>
      <Svg width={width} height={STRAND_HEIGHT} style={{ position: 'absolute' }}>
        <Path
          d={pathD}
          stroke={material.cord}
          strokeWidth={2}
          strokeOpacity={0.75}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {Array.from({ length: beadCount }, (_, index) => (
        <StrandBead
          key={index}
          index={index}
          lut={lut}
          progress={progress}
          material={material}
        />
      ))}
    </View>
  );
}

type StrandBeadProps = {
  index: number;
  lut: StrandLut;
  progress: ReturnType<typeof useSharedValue<number>>;
  material: BeadSkin;
};

/**
 * A single bead's placement.
 *
 * Its own component so each bead owns one `useAnimatedStyle` -- the hook cannot
 * be called in a loop, and giving every bead its own worklet is also what keeps
 * the per-frame work proportional to the visible window rather than the count.
 */
function StrandBead({ index, lut, progress, material }: StrandBeadProps) {
  const total = lut.total;

  const style = useAnimatedStyle(() => {
    // Guards the modulo below: a zero-length curve would make every position
    // NaN, and NaN in a transform silently drops the whole strand.
    if (total <= 0) return { opacity: 0 };

    // The strand slides one gap per stroke; wrapping is what recycles a bead
    // that has run off one end back onto the other.
    let s = (index * BEAD_GAP - progress.value * BEAD_GAP) % total;
    if (s < 0) s += total;

    const { x, y } = sampleStrand(lut, s);

    // Fades across one bead's width at each end of the curve, so a recycled
    // bead is already invisible by the time it teleports across the seam.
    const edge = Math.min(1, Math.min(s, total - s) / BEAD_GAP);

    return {
      opacity: edge,
      transform: [
        { translateX: x - BEAD_SIZE / 2 },
        { translateY: y - BEAD_SIZE / 2 },
        { scale: 0.88 + 0.12 * edge },
      ],
    };
  });

  return (
    // Bare Animated.View with no className: Reanimated owns this node's style,
    // and the bead's own SVG carries none. Never both on one node.
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <Bead skin={material} size={BEAD_SIZE} />
    </Animated.View>
  );
}
