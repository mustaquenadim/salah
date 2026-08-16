import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { MESH_COLORS, MESH_POINTS } from '@/lib/mesh-gradient';
import { THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

/** How far each control point's color bleeds, as a fraction of the surface. */
const BLEED = '62%';

/**
 * Web stand-in for {@link MeshGradientBackground}, since `expo-mesh-gradient`
 * ships apple and android platforms only.
 *
 * Rather than interpolating a mesh, this stacks one soft radial wash per control
 * point over the base background. Same palette and same positions, so the two
 * platforms land in the same place visually even though the math differs.
 */
export function MeshGradientBackground() {
  const { colorScheme } = useColorScheme();
  const colors = MESH_COLORS[colorScheme];

  return (
    // `absoluteFill` positions the element but leaves the SVG viewport at its
    // own default size, so the dimensions have to be stated as well.
    <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        {MESH_POINTS.map(([x, y], index) => (
          <RadialGradient
            key={index}
            id={`mesh-${index}`}
            cx={`${x * 100}%`}
            cy={`${y * 100}%`}
            r={BLEED}>
            <Stop offset="0" stopColor={colors[index]} stopOpacity={0.85} />
            <Stop offset="1" stopColor={colors[index]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={THEME[colorScheme].background} />
      {MESH_POINTS.map((_, index) => (
        <Rect key={index} x="0" y="0" width="100%" height="100%" fill={`url(#mesh-${index})`} />
      ))}
    </Svg>
  );
}
