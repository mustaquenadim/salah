import { Uniwind, useUniwind, type ThemeName } from 'uniwind';

/**
 * `'system'` hands control back to the OS setting (uniwind's adaptive mode);
 * `'light'`/`'dark'` pin the app to that theme until it is changed again.
 */
export type ColorSchemePreference = ThemeName | 'system';

/**
 * Read and change the active theme.
 *
 * Wraps uniwind's runtime so screens never touch `Uniwind` directly: the
 * `@variant light`/`@variant dark` blocks in src/global.css and `NAV_THEME` in
 * src/lib/theme.ts both follow whatever is set here.
 *
 * Note the choice lives in memory only -- a cold start falls back to the OS
 * setting until it is persisted.
 *
 * @example
 * ```tsx
 * const { isDarkColorScheme, toggleColorScheme } = useColorScheme();
 * ```
 */
export function useColorScheme() {
  const { theme, hasAdaptiveThemes } = useUniwind();

  return {
    /** The theme rendering right now -- resolved, so never `'system'`. */
    colorScheme: theme,
    isDarkColorScheme: theme === 'dark',
    /** What was picked: `'system'` while the OS is still in charge. */
    colorSchemePreference: (hasAdaptiveThemes ? 'system' : theme) as ColorSchemePreference,
    setColorScheme: (preference: ColorSchemePreference) => Uniwind.setTheme(preference),
    toggleColorScheme: () => Uniwind.setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
