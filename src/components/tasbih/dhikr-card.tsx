import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ARABIC_TEXT, type Dhikr } from '@/lib/dhikr';

type DhikrCardProps = {
  dhikr: Dhikr | null;
  onPress: () => void;
};

/**
 * The dhikr being counted, above the tab bar.
 *
 * An inline card rather than a peeking sheet: `ui/drawer.tsx` is built on the
 * dialog primitive and is modal by definition, and the floating pill already
 * owns the bottom band. The card is the resting state and the drawer is what
 * opens from it, which gets the same two-step without a second sheet mechanism.
 *
 * Translucent, so the mesh gradient behind it stays visible, and therefore
 * without elevation -- a shadow renders straight through a translucent fill.
 */
export function DhikrCard({ dhikr, onPress }: DhikrCardProps) {
  return (
    <Card className="bg-card/80 border-border/60 gap-3 rounded-2xl py-4">
      <View className="flex-row items-center justify-between gap-3 px-4">
        <Text className="text-foreground font-semibold">
          {dhikr ? 'Counting' : 'Start Dhikr'}
        </Text>
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10}>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </Pressable>
      </View>

      {dhikr ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${dhikr.transliteration}. ${dhikr.translation}. Tap to change.`}
          className="active:bg-accent/40 gap-0.5 px-4 py-1">
          {/* Arabic escapes the Latin-only Geist that `ui/text.tsx` applies --
              see ARABIC_TEXT. */}
          <Text className="text-foreground text-2xl" style={ARABIC_TEXT}>
            {dhikr.arabic}
          </Text>
          <Text className="text-foreground font-medium">{dhikr.transliteration}</Text>
          <Text className="text-muted-foreground text-sm">{dhikr.translation}</Text>
        </Pressable>
      ) : (
        <View className="gap-3 px-4">
          <Text className="text-muted-foreground text-sm">
            Don&apos;t just count your Tasbihs, make your Tasbihs count.
          </Text>
          <Button className="self-start rounded-full" onPress={onPress}>
            <Text>Select a Dhikr</Text>
          </Button>
        </View>
      )}
    </Card>
  );
}
