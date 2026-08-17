import { View } from 'react-native';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { CountdownBlock, TABULAR } from '@/components/home/countdown-block';
import { PRAYER_ICONS } from '@/components/home/prayer-icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/date-format';
import type { PrayerTimeline } from '@/lib/prayer-times';

type NextPrayerHeroProps = {
  timeline: PrayerTimeline;
  use24h: boolean;
};

/**
 * The focal card: which prayer is next, when it is, and how long is left.
 *
 * This is where the gold `highlight` token is spent -- the hairline border,
 * the badge, the countdown digits and the progress fill. Keeping all of it in
 * one cluster is what makes gold read as "this is the part that is changing"
 * rather than as a second brand colour competing with the midnight-blue
 * primary. Both come out of the same photo: the lamps and the water.
 */
export function NextPrayerHero({ timeline, use24h }: NextPrayerHeroProps) {
  const { next, current, windowStart, nextIsTomorrow } = timeline;

  // Sunrise is the next boundary between Fajr and Dhuhr, and counting down to
  // it is genuinely useful -- it is when Fajr's window closes. Calling it a
  // "next prayer" would not be, so the badge says what it actually is.
  const badgeLabel = nextIsTomorrow
    ? 'Tomorrow'
    : next.name === 'sunrise'
      ? 'Fajr ends'
      : 'Next prayer';

  return (
    // The animation lives on a bare wrapper with no className: Reanimated owns
    // this node's style, uniwind owns the Card's. Never both on one node.
    <NativeOnlyAnimatedView
      entering={FadeInDown.duration(340).reduceMotion(ReduceMotion.System)}>
      {/* bg-card/90 keeps text contrast high while letting the mesh gradient
          bleed through the edges. No elevation on a translucent card -- the
          shadow renders through the fill and muddies it. */}
      <Card className="bg-card/90 border-highlight/25 gap-4 rounded-2xl py-5">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <Badge variant="secondary" className="bg-highlight/15 border-highlight/30">
            <Text className="text-highlight">{badgeLabel}</Text>
          </Badge>
          <Icon as={PRAYER_ICONS[next.name]} className="text-highlight/60 size-6" />
        </CardHeader>

        <CardContent className="gap-3">
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className="text-foreground text-3xl font-semibold tracking-tight">
              {next.label}
            </Text>
            <Text className="text-muted-foreground text-lg font-medium" style={TABULAR}>
              {formatTime(next.time, use24h)}
            </Text>
          </View>

          <CountdownBlock
            start={windowStart}
            end={next.time}
            use24h={use24h}
            label={current ? `since ${current.label}` : `until ${next.label}`}
          />
        </CardContent>
      </Card>
    </NativeOnlyAnimatedView>
  );
}
