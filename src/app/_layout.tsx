import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeToggle } from '@/components/theme-toggle';
import { NAV_THEME } from '@/lib/theme';
import { useColorScheme } from '@/lib/use-color-scheme';

const SCREEN_OPTIONS = {
  headerRight: () => <ThemeToggle />,
} as const;

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={SCREEN_OPTIONS} />
      <PortalHost />
    </ThemeProvider>
  );
}
