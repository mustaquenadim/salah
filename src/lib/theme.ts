import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

/**
 * Mirrors the color tokens in src/global.css as hsl, for consumers that need a
 * raw value rather than a class -- primarily NAV_THEME below. Keep the two
 * files in sync: drift shows up as nav chrome that does not match the screens.
 */
export const THEME = {
  light: {
    background: 'hsl(216 55.6% 98.2%)',
    foreground: 'hsl(214 46.9% 12.5%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(214 46.9% 12.5%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(214 46.9% 12.5%)',
    primary: 'hsl(215.1 60% 40.2%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(220 36% 95.1%)',
    secondaryForeground: 'hsl(214 46.9% 12.5%)',
    muted: 'hsl(220 36% 95.1%)',
    mutedForeground: 'hsl(213.8 15.1% 41.6%)',
    accent: 'hsl(215 35.3% 93.3%)',
    accentForeground: 'hsl(214 46.9% 12.5%)',
    highlight: 'hsl(33.9 76.6% 45.3%)',
    highlightForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(5.3 60.7% 47.8%)',
    border: 'hsl(210 20.8% 90.6%)',
    input: 'hsl(210 20.8% 90.6%)',
    ring: 'hsl(215.1 60% 40.2%)',
    chart1: 'hsl(215.1 60% 40.2%)',
    chart2: 'hsl(211 54% 55.7%)',
    chart3: 'hsl(33.9 76.6% 45.3%)',
    chart4: 'hsl(215.8 26% 60.8%)',
    chart5: 'hsl(34.3 69.7% 58.6%)',
    radius: '0.625rem',
  },
  dark: {
    background: 'hsl(216.4 82.4% 6.7%)',
    foreground: 'hsl(212.3 52% 95.1%)',
    card: 'hsl(213.3 52.9% 10%)',
    cardForeground: 'hsl(212.3 52% 95.1%)',
    popover: 'hsl(213.3 52.9% 10%)',
    popoverForeground: 'hsl(212.3 52% 95.1%)',
    primary: 'hsl(216 82.8% 70.4%)',
    primaryForeground: 'hsl(216 53.8% 12.7%)',
    secondary: 'hsl(213.6 33.3% 14.7%)',
    secondaryForeground: 'hsl(212.3 52% 95.1%)',
    muted: 'hsl(213.6 33.3% 14.7%)',
    mutedForeground: 'hsl(212.9 15.4% 60.6%)',
    accent: 'hsl(212.1 32.6% 16.9%)',
    accentForeground: 'hsl(212.3 52% 95.1%)',
    highlight: 'hsl(36.6 100% 64.3%)',
    highlightForeground: 'hsl(30.7 95.3% 8.4%)',
    destructive: 'hsl(4 83.3% 64.7%)',
    // The css tokens are `oklch(1 0 0 / 10%)` and `/ 15%`; these are the same
    // white-over-`card` blends flattened, since NAV_THEME needs solid colors.
    border: 'hsl(213.6 28.7% 17.1%)',
    input: 'hsl(212.1 26.9% 20.4%)',
    ring: 'hsl(216 82.8% 70.4%)',
    chart1: 'hsl(216 82.8% 70.4%)',
    chart2: 'hsl(211.1 62.1% 55.5%)',
    chart3: 'hsl(36.6 100% 64.3%)',
    chart4: 'hsl(215.7 88.1% 83.5%)',
    chart5: 'hsl(33.1 90.7% 57.6%)',
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
