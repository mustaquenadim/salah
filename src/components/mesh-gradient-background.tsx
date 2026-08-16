import { MeshGradientView } from 'expo-mesh-gradient';
import { StyleSheet } from 'react-native';

import { MESH_COLORS, MESH_POINTS, MESH_SIZE } from '@/lib/mesh-gradient';
import { useColorScheme } from '@/lib/use-color-scheme';

/**
 * Full-bleed mesh gradient for the app background, driven by the theme.
 *
 * `expo-mesh-gradient` is native-only (SwiftUI `MeshGradient` on iOS, Compose on
 * Android), so the web target resolves the `.web.tsx` sibling instead, which
 * approximates the same control mesh with react-native-svg.
 *
 * Render it as the first child of a flex container and let siblings paint over
 * it -- it fills its parent and takes no touches.
 *
 * @example
 * ```tsx
 * <Tabs>
 *   <MeshGradientBackground />
 *   <TabSlot />
 * </Tabs>
 * ```
 */
export function MeshGradientBackground() {
  const { colorScheme } = useColorScheme();

  return (
    <MeshGradientView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      columns={MESH_SIZE}
      rows={MESH_SIZE}
      points={MESH_POINTS}
      colors={MESH_COLORS[colorScheme]}
      // Android samples the mesh itself rather than interpolating in a shader,
      // so the default of 1 leaves visible facets on a gradient this wide.
      resolution={{ x: 4, y: 4 }}
    />
  );
}
