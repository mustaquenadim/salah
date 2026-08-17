import { View } from 'react-native';

import { TABULAR } from '@/components/home/countdown-block';
import { Text } from '@/components/ui/text';
import { describeAlignment, describeBearing, formatBearing, formatDistanceKm } from '@/lib/qibla';

type QiblaReadoutProps = {
  bearing: number;
  distanceKm: number;
  /** Signed offset to the Qibla, or null with no live compass. */
  alignmentError: number | null;
  isAligned: boolean;
};

/**
 * The numbers under the dial: which way, how far, and whether you are there.
 *
 * The caption is the part that changes as the user turns, so it carries the
 * lock-on state. The bearing and distance stay put -- they are properties of
 * where the user is standing, not of how they are holding the phone.
 */
export function QiblaReadout({ bearing, distanceKm, alignmentError, isAligned }: QiblaReadoutProps) {
  return (
    <View className="items-center gap-2">
      {alignmentError == null ? (
        <Text variant="muted">Qibla direction</Text>
      ) : (
        /* Gold on the caption would be body copy in a 3.2:1 token -- the
           highlight is spent on the dial and the degrees instead. */
        <Text className="text-foreground text-lg font-medium">
          {describeAlignment(alignmentError, isAligned)}
        </Text>
      )}

      <View className="flex-row items-baseline gap-2">
        <Text
          className={
            isAligned
              ? 'text-highlight text-5xl font-semibold tracking-tight'
              : 'text-foreground text-5xl font-semibold tracking-tight'
          }
          style={TABULAR}>
          {formatBearing(bearing)}
        </Text>
        <Text variant="muted">{describeBearing(bearing)}</Text>
      </View>

      <Text variant="muted" style={TABULAR}>
        {formatDistanceKm(distanceKm)} to the Kaaba
      </Text>
    </View>
  );
}
