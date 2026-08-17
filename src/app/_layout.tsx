import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '@/components/theme-toggle';
import { NAV_THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

const SCREEN_OPTIONS = {
  headerRight: () => <ThemeToggle />,
} as const;

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    // Required for any gesture-handler gesture, including the drawer's
    // drag-to-dismiss. It has to enclose the PortalHost too, since portalled
    // content is what the drawer renders into.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={SCREEN_OPTIONS}>
          {/* The tab group draws its own chrome, so the stack header stays out of the way. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
