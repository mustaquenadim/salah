import { View } from 'react-native';

import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useNow } from '@/hooks/use-now';
import { formatCountdown, formatTime } from '@/lib/date-format';

/**
 * Tabular figures, applied as a style rather than a class.
 *
 * Tailwind compiles `tabular-nums` to `font-variant-numeric`, which uniwind has
 * no React Native mapping for. RN's own `fontVariant` prop is the supported
 * path, and Geist ships tnum figures. Without it the digits visibly jitter as
 * the countdown ticks.
 */
const TABULAR = { fontVariant: ['tabular-nums' as const] };

type CountdownBlockProps = {
  /** Boundary the current window opened at -- the progress origin. */
  start: Date;
  /** The next prayer's time. */
  end: Date;
  /** Caption under the bar, e.g. `since Asr`. */
  label: string;
  use24h: boolean;
};

/**
 * The only one-second ticker on the screen.
 *
 * `useNow` lives here, in the smallest leaf that needs it, so a tick re-renders
 * this block rather than the whole home screen.
 */
export function CountdownBlock({ start, end, label, use24h }: CountdownBlockProps) {
  const now = useNow(1000);

  // Recomputed from the wall clock every tick rather than decremented, so it
  // stays correct across timer drift and background throttling.
  const remaining = Math.max(0, end.getTime() - now);
  const span = Math.max(1, end.getTime() - start.getTime());
  // Rounded to an integer so Progress's internal spring animates about a
  // hundred times per window instead of once a second.
  const percent = Math.round(Math.min(1, Math.max(0, (now - start.getTime()) / span)) * 100);

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-highlight text-5xl font-semibold tracking-tight" style={TABULAR}>
          {formatCountdown(remaining)}
        </Text>
        <Text variant="muted">remaining</Text>
      </View>

      {/* Both classes are required: the root defaults to bg-primary/20 and the
          native indicator to bg-foreground, either of which would break the
          gold grouping. */}
      <Progress
        value={percent}
        className="bg-highlight/15 h-1.5"
        indicatorClassName="bg-highlight"
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs">{label}</Text>
        <Text className="text-muted-foreground text-xs" style={TABULAR}>
          {formatTime(end, use24h)}
        </Text>
      </View>
    </View>
  );
}

export { TABULAR };
