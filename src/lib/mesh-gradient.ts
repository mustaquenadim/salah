/**
 * Control mesh for the app background gradient.
 *
 * The colors sit deliberately close to `--color-background` in src/global.css so
 * the gradient reads as light falling on the backdrop rather than as artwork:
 * a few midnight-blue lifts, one warm whisper from the `highlight` family --
 * standing in for the lamplight in the home photo -- and the rest within a few
 * percent lightness of the base. Screens keep full text contrast.
 *
 * Like src/lib/theme.ts, these are hand-mirrored from the CSS tokens -- if the
 * background or primary hue moves there, retune these too.
 */

/** The mesh is square: `MESH_SIZE * MESH_SIZE` points and colors. */
export const MESH_SIZE = 3;

/**
 * Row-major, normalized to the view. Edge points stay pinned to their edge so
 * the mesh always covers the full surface; they slide along it, and the single
 * interior point is offset, to keep the falloff from looking like a grid.
 */
export const MESH_POINTS = [
  [0, 0],
  [0.45, 0],
  [1, 0],
  [0, 0.55],
  [0.55, 0.42],
  [1, 0.45],
  [0, 1],
  [0.55, 1],
  [1, 1],
];

/** Row-major, matching {@link MESH_POINTS} index for index. */
export const MESH_COLORS: Record<'light' | 'dark', string[]> = {
  light: [
    'hsl(210 88.9% 96.5%)',
    'hsl(30 80% 98%)',
    'hsl(216.9 100% 97.5%)',
    'hsl(34.3 77.8% 98.2%)',
    'hsl(212.7 100% 97.8%)',
    'hsl(213.3 100% 96.5%)',
    'hsl(30 85.7% 97.3%)',
    'hsl(216 100% 99%)',
    'hsl(216 100% 97.1%)',
  ],
  dark: [
    'hsl(211.4 87.5% 9.4%)',
    'hsl(217.1 72.4% 5.7%)',
    'hsl(218.2 70.2% 9.2%)',
    'hsl(216 76.9% 5.1%)',
    'hsl(215.2 78.4% 7.3%)',
    'hsl(209.4 95.9% 9.6%)',
    'hsl(27.9 93.3% 5.9%)',
    'hsl(217.1 77.8% 5.3%)',
    'hsl(216.7 75% 9.4%)',
  ],
};
