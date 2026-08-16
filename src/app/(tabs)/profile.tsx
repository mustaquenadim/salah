import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text variant="h3">Profile</Text>
      <Text variant="muted">Start building here.</Text>
    </View>
  );
}
