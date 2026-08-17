import * as React from 'react';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import type { BeadSkin } from '@/lib/bead-skins';

type BeadProps = {
  skin: BeadSkin;
  size: number;
};

/**
 * One bead.
 *
 * Static by design. The strand animates by moving the `Animated.View` this
 * sits inside; the SVG itself never changes, which keeps it off the animation
 * path entirely -- animated SVG props are the fragile way to do this and view
 * transforms are the fast, boring one.
 *
 * The sphere is two passes: a radial gradient with an off-centre focal point
 * for the body, and a small soft ellipse over it for the specular highlight.
 * The offset focus is what does the work -- a centred gradient reads as a flat
 * disc no matter how dark the rim gets.
 */
function BeadImpl({ skin, size }: BeadProps) {
  /*
   * Gradient ids have to be unique per mounted bead. SVG ids share one document
   * namespace, so a hardcoded id would have every bead on the strand resolve
   * `url(#…)` to whichever one mounted first -- which on Android means the
   * whole strand renders in a single material regardless of the skin.
   */
  const id = React.useId();
  const bodyId = `bead-body-${id}`;
  const glossId = `bead-gloss-${id}`;

  const radius = size / 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={bodyId} cx="50%" cy="50%" r="62%" fx="34%" fy="28%">
          <Stop offset="0%" stopColor={skin.specular} />
          <Stop offset="34%" stopColor={skin.body} />
          <Stop offset="78%" stopColor={skin.shade} />
          <Stop offset="100%" stopColor={skin.rim} />
        </RadialGradient>
        <RadialGradient id={glossId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={skin.specular} stopOpacity={0.95} />
          <Stop offset="100%" stopColor={skin.specular} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Inset by a hair so the rim stop is not clipped by the viewport edge. */}
      <Circle cx={radius} cy={radius} r={radius - 0.5} fill={`url(#${bodyId})`} />
      <Ellipse
        cx={radius * 0.72}
        cy={radius * 0.6}
        rx={radius * 0.34}
        ry={radius * 0.24}
        fill={`url(#${glossId})`}
      />
    </Svg>
  );
}

/**
 * Memoised on the skin object identity and the size, which is what makes the
 * "static" claim above hold: the strand re-renders on a skin change and on
 * nothing else.
 */
export const Bead = React.memo(BeadImpl);
