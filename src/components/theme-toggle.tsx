import { MoonStar, Sun } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useColorScheme } from '@/lib/use-color-scheme';

/**
 * Switches between the light and dark theme. The icon shows the theme it will
 * switch *to*, which is the convention users expect from a single-button
 * toggle.
 */
export function ThemeToggle() {
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      accessibilityLabel={`Switch to ${isDarkColorScheme ? 'light' : 'dark'} theme`}
      onPress={toggleColorScheme}>
      <Icon as={isDarkColorScheme ? Sun : MoonStar} className="size-5" />
    </Button>
  );
}
