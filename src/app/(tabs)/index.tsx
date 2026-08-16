import Kaaba01Icon from '@hugeicons/core-free-icons/Kaaba01Icon';
import { View } from 'react-native';

import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-2 p-6">
      <Icon as={Kaaba01Icon} className="text-primary size-16" />
      <Text variant="h3">Salah</Text>
      <Text variant="muted">Start building here.</Text>
      <ThemeToggle />
    </View>
  );
}
