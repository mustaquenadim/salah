import { View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for the dial and the readout.
 *
 * Sized from the same `size` the real dial gets, so the layout does not shift
 * when the location resolves and the compass takes its place.
 */
export function QiblaSkeleton({ size }: { size: number }) {
  return (
    <View className="items-center gap-6 pt-4">
      <Skeleton className="rounded-full" style={{ width: size, height: size }} />
      <View className="items-center gap-2">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-4 w-40 rounded-full" />
      </View>
    </View>
  );
}
