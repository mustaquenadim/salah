import { MapPin } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LocationStatus } from '@/lib/location-store';

type LocationPromptCardProps = {
  status: LocationStatus;
  canAskAgain: boolean;
  onEnable: () => void;
  onChooseCity: () => void;
};

const COPY: Record<string, { title: string; body: string }> = {
  denied: {
    title: 'Location needed',
    body: 'Prayer times depend on where you are. Allow location, or pick your city instead.',
  },
  disabled: {
    title: 'Location services are off',
    body: 'Turn on location services, or pick your city and prayer times will work offline.',
  },
  unavailable: {
    title: "Couldn't find you",
    body: 'Your location could not be determined just now. Pick your city to continue.',
  },
};

/**
 * Shown in place of the hero when there is no usable location.
 *
 * The prayer list is omitted entirely in this state rather than rendered empty
 * -- an empty schedule looks like a bug, a prompt looks like a next step.
 */
export function LocationPromptCard({
  status,
  canAskAgain,
  onEnable,
  onChooseCity,
}: LocationPromptCardProps) {
  const copy = COPY[status] ?? COPY.unavailable;

  return (
    <Card className="bg-card/90 gap-4 rounded-2xl py-5">
      <CardHeader className="gap-2">
        <Icon as={MapPin} className="text-primary size-7" />
        <Text className="text-foreground text-xl font-semibold tracking-tight">{copy.title}</Text>
        <Text variant="muted">{copy.body}</Text>
      </CardHeader>

      <CardContent>
        {/* Never offer a button that cannot do anything: once the OS will no
            longer show the prompt, picking a city is the real primary action
            and the only route back to GPS is the system settings app. */}
        <View className="gap-2">
          {canAskAgain && status !== 'disabled' ? (
            <>
              <Button onPress={onEnable}>
                <Text>Enable location</Text>
              </Button>
              <Button variant="outline" onPress={onChooseCity}>
                <Text>Choose a city</Text>
              </Button>
            </>
          ) : (
            <>
              <Button onPress={onChooseCity}>
                <Text>Choose a city</Text>
              </Button>
              <Button variant="ghost" onPress={() => void Linking.openSettings()}>
                <Text>Open settings</Text>
              </Button>
            </>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
