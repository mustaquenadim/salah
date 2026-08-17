import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for the hero and the list.
 *
 * Mirrors the real layout's dimensions -- a 5xl countdown line, a progress bar,
 * six 56pt rows -- so that nothing shifts when the real content lands.
 *
 * The header is not skeletonised: the Gregorian and Hijri dates do not depend
 * on location, so they are already real on the first frame.
 */
export function HomeSkeleton() {
  return (
    <View className="gap-4">
      <Card className="bg-card/90 gap-4 rounded-2xl py-5">
        <View className="flex-row items-center justify-between px-6">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
        </View>
        <View className="gap-3 px-6">
          <View className="flex-row items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-14" />
          </View>
          <Skeleton className="h-12 w-44" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </View>
      </Card>

      <Card className="bg-card/80 gap-0 py-2">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} className="h-14 flex-row items-center gap-3 px-4">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <View className="flex-1" />
            <Skeleton className="h-4 w-12" />
          </View>
        ))}
      </Card>
    </View>
  );
}
