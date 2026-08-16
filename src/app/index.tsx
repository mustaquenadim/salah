import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-2 p-6">
      <Text variant="h3">Salah</Text>
      <Text variant="muted">Start building here.</Text>
    </View>
  );
}
