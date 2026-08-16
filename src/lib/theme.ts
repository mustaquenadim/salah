import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

/**
 * Mirrors the color tokens in src/global.css as hsl, for consumers that need a
 * raw value rather than a class -- primarily NAV_THEME below. Keep the two
 * files in sync: drift shows up as nav chrome that does not match the screens.
 */
export const THEME = {
  light: {
    background: 'hsl(40 27.3% 97.8%)',
    foreground: 'hsl(156 18.5% 10.6%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(156 18.5% 10.6%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(156 18.5% 10.6%)',
    primary: 'hsl(158.5 76% 24.5%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(120 10.3% 94.3%)',
    secondaryForeground: 'hsl(156 18.5% 10.6%)',
    muted: 'hsl(120 10.3% 94.3%)',
    mutedForeground: 'hsl(152 7.5% 39%)',
    accent: 'hsl(144 12.8% 92.4%)',
    accentForeground: 'hsl(156 18.5% 10.6%)',
    highlight: 'hsl(40.3 89.3% 40.2%)',
    highlightForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(5.3 60.7% 47.8%)',
    border: 'hsl(120 5.9% 90%)',
    input: 'hsl(120 5.9% 90%)',
    ring: 'hsl(158.5 76% 24.5%)',
    chart1: 'hsl(158.5 76% 24.5%)',
    chart2: 'hsl(158.6 54.9% 40%)',
    chart3: 'hsl(40.3 89.3% 40.2%)',
    chart4: 'hsl(150 15.7% 54.9%)',
    chart5: 'hsl(39.1 66.7% 55.3%)',
    radius: '0.625rem',
  },
  dark: {
    background: 'hsl(150 15.4% 5.1%)',
    foreground: 'hsl(145.7 22.6% 93.9%)',
    card: 'hsl(156 11.1% 8.8%)',
    cardForeground: 'hsl(145.7 22.6% 93.9%)',
    popover: 'hsl(156 11.1% 8.8%)',
    popoverForeground: 'hsl(145.7 22.6% 93.9%)',
    primary: 'hsl(158.1 64.4% 51.6%)',
    primaryForeground: 'hsl(161.4 70.7% 8%)',
    secondary: 'hsl(162.9 10.4% 13.1%)',
    secondaryForeground: 'hsl(145.7 22.6% 93.9%)',
    muted: 'hsl(162.9 10.4% 13.1%)',
    mutedForeground: 'hsl(150 7.5% 58%)',
    accent: 'hsl(157.5 10.3% 15.3%)',
    accentForeground: 'hsl(145.7 22.6% 93.9%)',
    highlight: 'hsl(43.3 96.4% 56.3%)',
    highlightForeground: 'hsl(42.4 89.5% 7.5%)',
    destructive: 'hsl(4 83.3% 64.7%)',
    border: 'hsl(157.5 9.5% 16.5%)',
    input: 'hsl(160 9.1% 19.4%)',
    ring: 'hsl(158.1 64.4% 51.6%)',
    chart1: 'hsl(158.1 64.4% 51.6%)',
    chart2: 'hsl(160.1 84.1% 39.4%)',
    chart3: 'hsl(43.3 96.4% 56.3%)',
    chart4: 'hsl(156.2 71.6% 66.9%)',
    chart5: 'hsl(37.7 92.1% 50.2%)',
    radius: '0.625rem',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
