import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function QuranScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text variant="h3">Quran</Text>
      <Text variant="muted">Start building here.</Text>
    </View>
  );
}
