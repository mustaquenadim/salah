import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import {
  CALCULATION_METHODS,
  CALCULATION_METHOD_ORDER,
  MADHAB_LABELS,
  type CalculationMethodId,
  type MadhabId,
  type PrayerSettings,
} from '@/lib/prayer-settings';
import { cn } from '@/lib/utils';

type PrayerMethodPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PrayerSettings;
  onChange: (patch: Partial<PrayerSettings>) => void;
};

const MADHABS: readonly MadhabId[] = ['shafi', 'hanafi'];

/**
 * Lets the user override the calculation method and the Asr madhab.
 *
 * These default to what is customary in the detected country, but they vary
 * legitimately between communities in the same place, so the choice has to be
 * reachable. Changing either pins it -- moving countries will not silently
 * re-resolve a deliberate choice.
 */
export function PrayerMethodPicker({
  open,
  onOpenChange,
  settings,
  onChange,
}: PrayerMethodPickerProps) {
  function selectMethod(methodId: CalculationMethodId) {
    onChange({ methodId });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent maxHeightRatio={0.85} className="gap-3">
        <DrawerHeader>
          <DrawerTitle>Calculation</DrawerTitle>
        </DrawerHeader>

        <View className="gap-2">
          <Text variant="small" className="text-muted-foreground">
            Asr
          </Text>
          <View className="border-border flex-row gap-1 rounded-lg border p-1">
            {MADHABS.map((madhab) => {
              const active = settings.madhab === madhab;
              return (
                <Pressable
                  key={madhab}
                  onPress={() => onChange({ madhab })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  className={cn(
                    'flex-1 items-center rounded-md py-2',
                    active ? 'bg-primary' : 'active:bg-accent'
                  )}>
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      active ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                    {MADHAB_LABELS[madhab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-muted-foreground text-xs">
            Hanafi puts Asr roughly an hour later. Standard covers the Maliki, Shafi&apos;i and
            Hanbali schools.
          </Text>
        </View>

        <Separator />

        <Text variant="small" className="text-muted-foreground">
          Method
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
          {CALCULATION_METHOD_ORDER.map((id) => {
            const method = CALCULATION_METHODS[id];
            const active = settings.methodId === id;
            return (
              <Pressable
                key={id}
                onPress={() => selectMethod(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className="active:bg-accent -mx-2 min-h-12 flex-row items-center gap-3 rounded-md px-2 py-2">
                <View className="flex-1">
                  <Text className={cn('text-foreground', active && 'font-semibold')}>
                    {method.label}
                  </Text>
                  <Text className="text-muted-foreground text-xs">{method.detail}</Text>
                </View>
                {active ? <Icon as={Check} className="text-primary size-5" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </DrawerContent>
    </Drawer>
  );
}
