import { Check } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { ADHKAR, ARABIC_TEXT, type Dhikr } from '@/lib/dhikr';

type DhikrPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string | null;
  onSelect: (dhikr: Dhikr) => void;
};

/**
 * The bundled adhkar, in a drawer.
 *
 * Same shape as `city-picker.tsx`: a fixed `heightRatio` because it holds a
 * list, so the panel does not resize as the content changes. No search field --
 * fifteen entries fit inside two scrolls, and a filter would cost more taps
 * than it saved.
 */
export function DhikrPicker({ open, onOpenChange, selectedId, onSelect }: DhikrPickerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent heightRatio={0.8} className="gap-3">
        <DrawerHeader>
          <DrawerTitle>Choose a dhikr</DrawerTitle>
        </DrawerHeader>

        {/* flex-1 so the list takes the drawer's remaining height and scrolls
            inside it, rather than growing the panel past the screen. */}
        <FlatList
          className="flex-1"
          data={ADHKAR}
          keyExtractor={(dhikr) => dhikr.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Separator className="opacity-50" />}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.transliteration}. ${item.translation}.`}
                className="active:bg-accent -mx-2 flex-row items-center gap-3 rounded-md px-2 py-3">
                <View className="flex-1 gap-0.5">
                  {/* Arabic escapes the Latin-only Geist -- see ARABIC_TEXT. */}
                  <Text className="text-foreground text-2xl" style={ARABIC_TEXT}>
                    {item.arabic}
                  </Text>
                  <Text className="text-foreground font-medium">{item.transliteration}</Text>
                  <Text className="text-muted-foreground text-sm">{item.translation}</Text>
                </View>

                <View className="items-end gap-1">
                  <Text className="text-muted-foreground text-xs">×{item.defaultTarget}</Text>
                  {selected ? <Icon as={Check} className="text-primary size-5" /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}
