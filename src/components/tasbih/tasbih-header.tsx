import { RotateCcw, Vibrate, VibrateOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type TasbihHeaderProps = {
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onReset: () => void;
};

/**
 * Title and the two screen actions.
 *
 * No back arrow -- Tasbih is a tab, not a pushed route -- and no theme toggle,
 * which Home owns.
 *
 * The second button is haptics rather than sound. The app ships no tick asset,
 * and a tick would need more than an asset drop: `prayer-alerts.tsx` sets an
 * app-wide audio mode of `{ playsInSilentMode: true, interruptionMode:
 * 'doNotMix' }` for the adhan, and reusing it here would duck the user's music
 * on every single bead. A tick would need its own `useAudioPlayer` and its own
 * mode, or none at all.
 */
export function TasbihHeader({ hapticsEnabled, onToggleHaptics, onReset }: TasbihHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-5">
      <Text variant="h3">Tasbih</Text>

      <View className="flex-row items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          accessibilityLabel={hapticsEnabled ? 'Turn off vibration' : 'Turn on vibration'}
          onPress={onToggleHaptics}>
          <Icon
            as={hapticsEnabled ? Vibrate : VibrateOff}
            className={hapticsEnabled ? 'text-foreground size-5' : 'text-muted-foreground size-5'}
          />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          accessibilityLabel="Reset the count"
          onPress={onReset}>
          <Icon as={RotateCcw} className="size-5" />
        </Button>
      </View>
    </View>
  );
}
