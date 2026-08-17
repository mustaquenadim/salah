import { Pressable, View } from 'react-native';

import { Bead } from '@/components/tasbih/bead';
import { BEAD_SKINS, type BeadSkinId } from '@/lib/bead-skins';

/** Swatch diameter. Smaller than a strand bead, but still a comfortable target. */
const SWATCH_SIZE = 40;

type BeadSkinRowProps = {
  value: BeadSkinId;
  onChange: (id: BeadSkinId) => void;
};

/**
 * Picks the bead material.
 *
 * The swatches are the actual bead component at a smaller size, so what is
 * being chosen is shown rather than described. The selection ring is drawn in
 * `primary` -- the beads are the one place in the app allowed off-palette, but
 * the chrome around them is not.
 */
export function BeadSkinRow({ value, onChange }: BeadSkinRowProps) {
  return (
    <View className="flex-row items-center justify-center gap-3" accessibilityRole="radiogroup">
      {BEAD_SKINS.map((skin) => {
        const selected = skin.id === value;
        return (
          <Pressable
            key={skin.id}
            onPress={() => onChange(skin.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${skin.label} beads`}
            hitSlop={6}
            // Unselected swatches keep a faint ring rather than none: onyx is
            // nearly the background colour in dark mode, and without an edge it
            // reads as an empty gap in the row instead of a bead.
            className={
              selected
                ? 'border-primary rounded-full border-2 p-1'
                : 'border-border/50 rounded-full border-2 p-1 active:opacity-70'
            }>
            <Bead skin={skin} size={SWATCH_SIZE} />
          </Pressable>
        );
      })}
    </View>
  );
}
