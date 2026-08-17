import { LocateFixed, Search } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { searchCities, type City } from '@/lib/cities';

type CityPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (city: City) => void;
  onUseDeviceLocation: () => void;
  canUseDeviceLocation: boolean;
};

/**
 * Offline city search, used as the location fallback and reusable from a future
 * settings screen -- which is why it lives beside the other cross-screen
 * components rather than under `home/`.
 */
export function CityPicker({
  open,
  onOpenChange,
  onSelect,
  onUseDeviceLocation,
  canUseDeviceLocation,
}: CityPickerProps) {
  const [query, setQuery] = React.useState('');

  const results = React.useMemo(() => searchCities(query, 60), [query]);

  // Cleared on the way out rather than in an effect on `open`, so each visit
  // starts fresh without a second render pass just to reset the field.
  function handleOpenChange(next: boolean) {
    if (!next) setQuery('');
    onOpenChange(next);
  }

  function handleSelect(city: City) {
    setQuery('');
    onSelect(city);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent heightRatio={0.8} className="gap-3">
        <DrawerHeader>
          <DrawerTitle>Choose your city</DrawerTitle>
        </DrawerHeader>

        <View className="relative justify-center">
          {/* The positioning lives on this View, not on the Icon: `Icon` is a
              `withUniwind` SVG that only maps `size` and `color` out of its
              className, so layout utilities on it are silently dropped and the
              glyph lands above the field instead of inside it.
              top-0/bottom-0 rather than inset-y-* -- see floating-tab-bar.tsx. */}
          <View
            pointerEvents="none"
            className="absolute bottom-0 left-4 top-0 z-10 justify-center">
            <Icon as={Search} className="text-muted-foreground size-4" />
          </View>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search city or country"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="rounded-full pl-10 pr-4"
          />
        </View>

        {canUseDeviceLocation ? (
          <View className="gap-1">
            <Pressable
              onPress={onUseDeviceLocation}
              accessibilityRole="button"
              className="active:bg-accent -mx-2 flex-row items-center gap-3 rounded-md px-2 py-3">
              <Icon as={LocateFixed} className="text-primary size-5" />
              <Text className="text-primary font-medium">Use my location</Text>
            </Pressable>
            <Separator />
          </View>
        ) : null}

        {/* flex-1 so the list takes the drawer's remaining height and scrolls
            inside it, rather than growing the panel past the screen. */}
        <FlatList
          className="flex-1"
          data={results}
          keyExtractor={(city) => city.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Separator className="opacity-50" />}
          ListEmptyComponent={
            <Text variant="muted" className="py-6 text-center">
              No matching city. Try the nearest large city instead.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.country}`}
              className="active:bg-accent -mx-2 min-h-12 justify-center rounded-md px-2 py-2">
              <Text className="text-foreground">{item.name}</Text>
              <Text className="text-muted-foreground text-sm">{item.country}</Text>
            </Pressable>
          )}
        />
      </DrawerContent>
    </Drawer>
  );
}
