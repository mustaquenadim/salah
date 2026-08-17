import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persisted keys.
 *
 * Every key carries a version suffix so that changing a stored shape is a cache
 * miss rather than a crash on a value the current code can no longer parse.
 * Bump the suffix instead of writing a migration.
 */
export const STORAGE_KEYS = {
  location: 'salah.location.v1',
  /** `'auto' | 'manual'` -- whether GPS is allowed to overwrite the location. */
  locationMode: 'salah.location-mode.v1',
  settings: 'salah.prayer-settings.v1',
} as const;

/*
 * AsyncStorage rather than `expo-sqlite/kv-store`: app.json sets
 * `web.output: "static"`, and SQLite on web is alpha and needs COOP/COEP headers
 * plus Metro wasm config, while AsyncStorage is just localStorage there.
 *
 * If web is ever dropped, `expo-sqlite/kv-store` is a documented drop-in for
 * this API and additionally offers a synchronous `getItemSync`.
 */

/** Reads and parses a stored value. Returns null for missing *or* unreadable. */
export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn(`[storage] failed to read ${key}`, error);
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] failed to write ${key}`, error);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] failed to remove ${key}`, error);
  }
}
