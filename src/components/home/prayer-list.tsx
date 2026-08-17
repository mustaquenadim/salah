import { Pressable, View } from 'react-native';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { TABULAR } from '@/components/home/countdown-block';
import { PRAYER_ICONS } from '@/components/home/prayer-icons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/date-format';
import type { PrayerEntry, PrayerStatus, PrayerTimeline } from '@/lib/prayer-times';
import { cn } from '@/lib/utils';

type PrayerListProps = {
  timeline: PrayerTimeline;
  use24h: boolean;
  /** e.g. `Muslim World League · Standard`. */
  methodLabel: string;
  onPressMethod: () => void;
};

/**
 * Today's six boundaries.
 *
 * More translucent than the hero (`bg-card/80` against its `/90`), so the
 * hierarchy between the two is carried by opacity as well as by size.
 */
export function PrayerList({ timeline, use24h, methodLabel, onPressMethod }: PrayerListProps) {
  return (
    <Card className="bg-card/80 gap-0 py-2">
      {timeline.entries.map((entry, index) => (
        <NativeOnlyAnimatedView
          key={entry.name}
          entering={FadeInDown.delay(80 + index * 45)
            .duration(260)
            .reduceMotion(ReduceMotion.System)}>
          <PrayerRow entry={entry} status={timeline.statusOf[entry.name]} use24h={use24h} />
          {index < timeline.entries.length - 1 ? (
            // Inset to where the text starts, the standard list idiom.
            <Separator className="ml-14 mr-4 w-auto opacity-60" />
          ) : null}
        </NativeOnlyAnimatedView>
      ))}

      {/* Honest disclosure of the two religiously significant defaults, and the
          way into changing them. */}
      <Pressable
        onPress={onPressMethod}
        accessibilityRole="button"
        accessibilityLabel={`Calculation method: ${methodLabel}. Tap to change.`}
        className="active:opacity-60 px-4 pb-1 pt-3">
        <Text className="text-muted-foreground text-xs">{methodLabel}</Text>
      </Pressable>
    </Card>
  );
}

type PrayerRowProps = {
  entry: PrayerEntry;
  status: PrayerStatus;
  use24h: boolean;
};

/*
 * Past rows are dimmed with `text-muted-foreground`, never with `opacity-50`:
 * an opacity wash over a translucent card sitting on a gradient turns to mush,
 * whereas the muted token is a designed contrast ratio.
 *
 * There are deliberately no checkmarks -- the app does not track whether the
 * user actually prayed, and implying that it does would be wrong.
 */
function PrayerRow({ entry, status, use24h }: PrayerRowProps) {
  const isCurrent = status === 'current';
  const isNext = status === 'next';
  const isPast = status === 'past';

  const iconClass = isCurrent
    ? 'text-primary'
    : isNext
      ? 'text-highlight'
      : 'text-muted-foreground';

  // Sunrise stays muted whatever its status: it closes Fajr's window rather
  // than being a prayer of its own, and it should not read as one.
  const nameClass = !entry.isFard
    ? 'text-muted-foreground'
    : isCurrent
      ? 'text-foreground font-semibold'
      : isNext
        ? 'text-foreground font-medium'
        : isPast
          ? 'text-muted-foreground'
          : 'text-foreground';

  const timeClass = isCurrent
    ? 'text-foreground font-semibold'
    : isNext
      ? 'text-highlight font-semibold'
      : isPast
        ? 'text-muted-foreground'
        : 'text-foreground';

  return (
    <View
      className={cn(
        'h-14 flex-row items-center gap-3 px-4',
        isCurrent && 'bg-primary/10 mx-2 rounded-lg px-2'
      )}>
      <Icon as={PRAYER_ICONS[entry.name]} className={cn('size-5', iconClass)} />
      <Text className={cn('flex-1', nameClass)}>{entry.label}</Text>
      <Text style={TABULAR} className={timeClass}>
        {formatTime(entry.time, use24h)}
      </Text>
    </View>
  );
}
