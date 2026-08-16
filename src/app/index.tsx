import Kaaba01Icon from '@hugeicons/core-free-icons/Kaaba01Icon';
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-2 p-6">
      <Icon as={Kaaba01Icon} className="text-primary size-16" />
      <Icon as={ArrowRight} className="text-primary size-8" />
      <Text variant="h3">Salah</Text>
      <Text variant="muted">Start building here.</Text>
    </View>
  );
}
