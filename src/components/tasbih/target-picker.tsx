import * as React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { MAX_TARGET } from '@/lib/tasbih-store';

/** The counts a tasbih is actually kept to. Everything else is the free field. */
const PRESETS = [33, 34, 99, 100] as const;

type TargetPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: number;
  onChange: (target: number) => void;
};

/**
 * Sets the count a loop completes at.
 *
 * Content-sized rather than a fixed `heightRatio`: it holds four chips and a
 * field, and pinning it to a fraction of the screen would leave a drawer mostly
 * full of nothing.
 */
export function TargetPicker({ open, onOpenChange, target, onChange }: TargetPickerProps) {
  const [custom, setCustom] = React.useState('');

  // Cleared on the way out rather than in an effect on `open`, so each visit
  // starts fresh without a second render pass just to reset the field.
  function handleOpenChange(next: boolean) {
    if (!next) setCustom('');
    onOpenChange(next);
  }

  function commit(value: number) {
    setCustom('');
    onChange(value);
    onOpenChange(false);
  }

  const parsed = Number.parseInt(custom, 10);
  const customValid = Number.isFinite(parsed) && parsed >= 1 && parsed <= MAX_TARGET;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="gap-4">
        <DrawerHeader>
          <DrawerTitle>Count to</DrawerTitle>
          <DrawerDescription>
            The loop completes and starts again at this number.
          </DrawerDescription>
        </DrawerHeader>

        <View className="flex-row flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const selected = preset === target;
            return (
              <Button
                key={preset}
                variant={selected ? 'default' : 'outline'}
                className="rounded-full"
                accessibilityState={{ selected }}
                onPress={() => commit(preset)}>
                <Text>{preset}</Text>
              </Button>
            );
          })}
        </View>

        <DrawerFooter>
          <View className="flex-row items-center gap-2">
            <Input
              value={custom}
              onChangeText={setCustom}
              placeholder="Custom"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={4}
              onSubmitEditing={() => {
                if (customValid) commit(parsed);
              }}
              className="flex-1 rounded-full px-4"
            />
            <Button
              disabled={!customValid}
              className="rounded-full"
              onPress={() => commit(parsed)}>
              <Text>Set</Text>
            </Button>
          </View>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
