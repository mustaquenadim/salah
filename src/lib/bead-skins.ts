/**
 * Bead materials for the tasbih strand.
 *
 * This is the one module in the app that is deliberately off-palette.
 *
 * Everything else answers to the two chromatic families in global.css --
 * midnight blue and lamp gold -- but a misbaha is a physical object, and the
 * thing being simulated here is a material, not a UI surface. Onyx, pearl,
 * ruby, amber and copper are what the beads are *made of*; expressing them in
 * `primary` and `highlight` would produce five tints of the same bead rather
 * than five different strands.
 *
 * The values are therefore literal hex rather than theme tokens, on purpose,
 * and they are theme-independent: a physical bead does not change colour when
 * the room lights come on. What keeps this from leaking is the consumer rule --
 * only `bead.tsx` and `bead-skin-row.tsx` may import from here. No text, icon,
 * border or background anywhere else in the app takes a colour from this file.
 *
 * Each skin is four radial-gradient stops read from the lit side outward:
 *
 *   specular -- the blown-out highlight where the light source hits
 *   body     -- the bead's actual colour, the largest area
 *   shade    -- the terminator, where the sphere turns away
 *   rim      -- the darkest edge, which is what reads as roundness
 *
 * `cord` is the thread the beads hang on, drawn under them.
 */

export type BeadSkin = {
  id: BeadSkinId;
  /** Screen-reader name for the swatch. */
  label: string;
  specular: string;
  body: string;
  shade: string;
  rim: string;
  cord: string;
};

export type BeadSkinId = 'onyx' | 'pearl' | 'ruby' | 'amber' | 'copper';

export const BEAD_SKINS: readonly BeadSkin[] = [
  {
    id: 'onyx',
    label: 'Onyx',
    specular: '#8e9099',
    body: '#33353c',
    shade: '#17181c',
    rim: '#0a0a0c',
    cord: '#6b6d75',
  },
  {
    id: 'pearl',
    label: 'Pearl',
    specular: '#ffffff',
    body: '#eceaea',
    shade: '#bdb8b6',
    rim: '#8e8785',
    cord: '#f2f0ee',
  },
  {
    id: 'ruby',
    label: 'Ruby',
    specular: '#ffd9d2',
    body: '#c9252c',
    shade: '#7d1116',
    rim: '#4a070a',
    cord: '#e0868a',
  },
  {
    id: 'amber',
    label: 'Amber',
    specular: '#fff6c4',
    body: '#e0b719',
    shade: '#93720a',
    rim: '#5c4705',
    cord: '#e8cf7a',
  },
  {
    id: 'copper',
    label: 'Copper',
    specular: '#f7ddc0',
    body: '#c07c4a',
    shade: '#7d4726',
    rim: '#4d2b16',
    cord: '#d3a985',
  },
] as const;

export const DEFAULT_BEAD_SKIN: BeadSkinId = 'pearl';

const BY_ID = new Map(BEAD_SKINS.map((skin) => [skin.id, skin]));

/** Never returns null: an unknown id falls back to the default material. */
export function findBeadSkin(id: string): BeadSkin {
  return BY_ID.get(id as BeadSkinId) ?? BY_ID.get(DEFAULT_BEAD_SKIN)!;
}

export function isBeadSkinId(value: unknown): value is BeadSkinId {
  return typeof value === 'string' && BY_ID.has(value as BeadSkinId);
}
