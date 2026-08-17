import { Compass, Magnet, MapPin, Smartphone, TabletSmartphone } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';

export type QiblaHintKind =
  /** The OS says it does not trust the compass. */
  | 'calibrate'
  /** Falling back to magnetic north because true north is not available yet. */
  | 'magnetic'
  /** Tilting the phone skews a magnetometer reading. */
  | 'lay-flat'
  /** No magnetometer at all -- the dial is static. */
  | 'no-compass'
  /** There is a compass, but reading it needs location access. */
  | 'compass-permission'
  /** Bearing is computed for a hand-picked city, not for where the phone is. */
  | 'manual-city';

const COPY: Record<QiblaHintKind, { icon: LucideIcon; title: string; body: string }> = {
  calibrate: {
    icon: Compass,
    title: 'Calibrate your compass',
    body: 'Move your phone in a figure of eight a few times. Readings are unreliable until you do.',
  },
  magnetic: {
    icon: Magnet,
    title: 'Using magnetic north',
    body: 'Waiting on a location fix to correct for magnetic declination. The direction will sharpen on its own.',
  },
  'lay-flat': {
    icon: Smartphone,
    title: 'Hold your phone level',
    body: 'Tilting it skews the compass. Lay it flat in your palm for the truest reading.',
  },
  'no-compass': {
    icon: TabletSmartphone,
    title: 'No compass on this device',
    body: 'The dial is showing the Qibla as an angle from north instead of tracking as you turn.',
  },
  // Deliberately not folded into 'no-compass': the phone is perfectly capable,
  // and telling someone their hardware is missing when the real answer is a
  // permission toggle sends them looking for a fix that does not exist.
  'compass-permission': {
    icon: Compass,
    title: 'Compass needs location access',
    body: 'The dial is showing the Qibla as a fixed angle from north. Allow location and it will track as you turn.',
  },
  'manual-city': {
    icon: MapPin,
    title: 'Direction is for your chosen city',
    body: 'The compass still tracks your phone, but the bearing is measured from the city you picked.',
  },
};

type QiblaHintCardProps = {
  kind: QiblaHintKind;
  /** Optional resolution, for the hints the user can actually act on. */
  action?: { label: string; onPress: () => void };
};

/**
 * A single advisory line under the compass.
 *
 * The screen shows at most one of these at a time, by priority -- five
 * simultaneous warnings would be a wall of nagging that teaches the user to
 * ignore all of them. Styled as a quiet card rather than an alert: none of
 * these are errors, and the dial keeps working through every one of them.
 */
export function QiblaHintCard({ kind, action }: QiblaHintCardProps) {
  const copy = COPY[kind];

  return (
    // Bare wrapper with no className: Reanimated owns this node, uniwind owns
    // the Card's. Never both on one node.
    <NativeOnlyAnimatedView entering={FadeInDown.duration(340).reduceMotion(ReduceMotion.System)}>
      <Card className="bg-card/80 rounded-2xl py-4">
        <CardContent className="flex-row items-start gap-3">
          <Icon as={copy.icon} className="text-muted-foreground mt-0.5 size-5" />
          <View className="flex-1 gap-1">
            <Text className="text-foreground font-medium">{copy.title}</Text>
            <Text variant="muted" className="text-sm">
              {copy.body}
            </Text>
            {action ? (
              <Button variant="outline" size="sm" onPress={action.onPress} className="mt-2 self-start">
                <Text>{action.label}</Text>
              </Button>
            ) : null}
          </View>
        </CardContent>
      </Card>
    </NativeOnlyAnimatedView>
  );
}
