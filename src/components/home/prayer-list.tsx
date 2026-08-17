import { AlarmClock, AlarmClockOff } from 'lucide-react-native';
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
import { isRemindable, type PrayerReminders } from '@/lib/reminder-store';
import type { PrayerEntry, PrayerName, PrayerStatus, PrayerTimeline } from '@/lib/prayer-times';
import { cn } from '@/lib/utils';

type PrayerListProps = {
  timeline: PrayerTimeline;
  use24h: boolean;
  /** e.g. `Muslim World League · Standard`. */
  methodLabel: string;
  onPressMethod: () => void;
  reminders: PrayerReminders;
  onToggleReminder: (name: PrayerName) => void;
};

/**
 * Today's six boundaries.
 *
 * More translucent than the hero (`bg-card/80` against its `/90`), so the
 * hierarchy between the two is carried by opacity as well as by size.
 */
export function PrayerList({
  timeline,
  use24h,
  methodLabel,
  onPressMethod,
  reminders,
  onToggleReminder,
}: PrayerListProps) {
  return (
    <Card className="bg-card/80 gap-0 py-2">
      {timeline.entries.map((entry, index) => (
        <NativeOnlyAnimatedView
          key={entry.name}
          entering={FadeInDown.delay(80 + index * 45)
            .duration(260)
            .reduceMotion(ReduceMotion.System)}>
          <PrayerRow
            entry={entry}
            status={timeline.statusOf[entry.name]}
            use24h={use24h}
            reminderOn={reminders[entry.name]}
            onToggleReminder={onToggleReminder}
          />
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
  reminderOn: boolean;
  onToggleReminder: (name: PrayerName) => void;
};

/*
 * Past rows are dimmed with `text-muted-foreground`, never with `opacity-50`:
 * an opacity wash over a translucent card sitting on a gradient turns to mush,
 * whereas the muted token is a designed contrast ratio.
 *
 * There are deliberately no checkmarks -- the app does not track whether the
 * user actually prayed, and implying that it does would be wrong.
 */
function PrayerRow({ entry, status, use24h, reminderOn, onToggleReminder }: PrayerRowProps) {
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
      <ReminderToggle entry={entry} on={reminderOn} onToggle={onToggleReminder} />
    </View>
  );
}

type ReminderToggleProps = {
  entry: PrayerEntry;
  on: boolean;
  onToggle: (name: PrayerName) => void;
};

/**
 * Per-prayer alarm toggle, trailing the time.
 *
 * The slot keeps its width for Sunrise -- which has no reminder, being a
 * boundary rather than a prayer -- so the time column stays right-aligned down
 * the whole list instead of Sunrise's time sliding out past the others.
 *
 * On and off differ in *shape* as well as colour (the struck-through clock),
 * because a colour-only state is invisible to a colour-blind user and nearly
 * invisible to anyone in sunlight.
 */
function ReminderToggle({ entry, on, onToggle }: ReminderToggleProps) {
  if (!isRemindable(entry.name)) return <View className="w-8" />;

  return (
    <Pressable
      onPress={() => onToggle(entry.name)}
      // The icon is small on purpose -- it is secondary to the time -- so the
      // touch target comes from the padding and hit slop, not from the glyph.
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${entry.label} reminder`}
      accessibilityHint={on ? 'Turns the reminder off' : 'Turns the reminder on'}
      className="w-8 items-end justify-center py-2 active:opacity-60">
      <Icon
        as={on ? AlarmClock : AlarmClockOff}
        className={cn('size-4', on ? 'text-primary' : 'text-muted-foreground opacity-50')}
      />
    </Pressable>
  );
}
