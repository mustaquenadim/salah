/**
 * Control mesh for the app background gradient.
 *
 * The colors sit deliberately close to `--color-background` in src/global.css so
 * the gradient reads as light falling on the backdrop rather than as artwork:
 * two emerald lifts, one warm whisper from the `highlight` family, and the rest
 * within a few percent lightness of the base. Screens keep full text contrast.
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
    'hsl(152 30% 93.5%)',
    'hsl(44 34% 97%)',
    'hsl(160 26% 94.5%)',
    'hsl(42 28% 97.6%)',
    'hsl(150 18% 96.2%)',
    'hsl(158 30% 92.8%)',
    'hsl(42 42% 95.6%)',
    'hsl(40 27.3% 97.8%)',
    'hsl(154 24% 94.2%)',
  ],
  dark: [
    'hsl(160 34% 10.5%)',
    'hsl(154 20% 6.6%)',
    'hsl(164 30% 9%)',
    'hsl(150 16% 5.4%)',
    'hsl(157 22% 7.6%)',
    'hsl(162 38% 11.5%)',
    'hsl(44 22% 8%)',
    'hsl(152 16% 5.6%)',
    'hsl(158 30% 9.5%)',
  ],
};
