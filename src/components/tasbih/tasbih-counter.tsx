import { Pencil } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { TABULAR } from '@/components/home/countdown-block';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type TasbihCounterProps = {
  count: number;
  loops: number;
  target: number;
  onPressTarget: () => void;
};

/**
 * The count itself.
 *
 * Gold rather than blue: `highlight` is the token reserved for time-sensitive,
 * changing state -- the next prayer, the countdown -- and a running count is
 * exactly that. At this size it is well inside the large-text allowance the
 * palette documents for gold on card.
 */
export function TasbihCounter({ count, loops, target, onPressTarget }: TasbihCounterProps) {
  /*
   * The loop in progress, not the number completed: someone on their first
   * round is on loop 1, and a "Loop 0" would read as broken.
   *
   * The exception is the moment of completion, where the count is resting on
   * the target and `loops` has already been credited -- there the loop on
   * screen is the one just finished, so it must not advance until the next tap
   * actually starts a new round.
   */
  const currentLoop = count >= target ? loops : loops + 1;

  return (
    <View className="items-center gap-2">
      <Badge variant="secondary" className="bg-highlight/15 border-highlight/30">
        <Text className="text-highlight" style={TABULAR}>
          Loop {currentLoop}
        </Text>
      </Badge>

      <Text
        className="text-highlight text-7xl font-semibold tracking-tight"
        // Without tabular figures the digits shift width on every tap and the
        // whole number visibly jitters. `tabular-nums` has no uniwind mapping,
        // so this comes from the same constant the countdown uses.
        style={TABULAR}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${count} of ${target}`}>
        {String(count).padStart(2, '0')}
      </Text>

      <Pressable
        onPress={onPressTarget}
        accessibilityRole="button"
        accessibilityLabel={`Target ${target}. Tap to change.`}
        hitSlop={12}
        className="flex-row items-center gap-1.5 active:opacity-60">
        <Text className="text-muted-foreground text-lg" style={TABULAR}>
          / {target}
        </Text>
        <Icon as={Pencil} className="text-muted-foreground size-4" />
      </Pressable>
    </View>
  );
}
