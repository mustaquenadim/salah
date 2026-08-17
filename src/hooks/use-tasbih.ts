import * as Haptics from 'expo-haptics';
import * as React from 'react';

import { findDhikr, type Dhikr } from '@/lib/dhikr';
import {
  decrement,
  getSnapshot,
  increment,
  initTasbih,
  reset,
  setBeadSkin,
  setDhikr,
  setTarget,
  subscribe,
  toggleHaptics,
  type TasbihState,
} from '@/lib/tasbih-store';

type Tasbih = TasbihState & {
  /** The selected dhikr, resolved. Null when none is chosen. */
  dhikr: Dhikr | null;
  /** Count one, with the matching haptic. */
  tap: () => void;
  /** Undo one count, with a soft haptic. */
  back: () => void;
  setTarget: typeof setTarget;
  setDhikr: typeof setDhikr;
  setBeadSkin: typeof setBeadSkin;
  toggleHaptics: typeof toggleHaptics;
  reset: typeof reset;
};

/**
 * Fired and forgotten. A haptic that fails -- an unsupported device, a system
 * setting, a simulator -- is never worth surfacing, and never worth blocking a
 * count on.
 */
function feedback(kind: 'tick' | 'loop' | 'back'): void {
  if (!getSnapshot().hapticsEnabled) return;

  if (kind === 'loop') {
    // A completed loop is the only moment worth a distinct, heavier signal --
    // it is the one thing the user would otherwise have to look up to notice.
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return;
  }

  void Haptics.impactAsync(
    kind === 'back' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light
  ).catch(() => {});
}

/**
 * The tasbih counter's state and actions.
 *
 * Haptics live here rather than in the store: the store is the persisted
 * contract and stays free of platform effects, so it can be read and tested
 * without a native module behind it.
 */
export function useTasbih(): Tasbih {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    initTasbih();
  }, []);

  const tap = React.useCallback(() => {
    feedback(increment());
  }, []);

  const back = React.useCallback(() => {
    // Read before the call: `decrement` floors at zero, and a swipe that
    // changed nothing should not buzz as though it had.
    if (getSnapshot().count === 0) return;
    decrement();
    feedback('back');
  }, []);

  const dhikr = state.dhikrId ? findDhikr(state.dhikrId) : null;

  return {
    ...state,
    dhikr,
    tap,
    back,
    setTarget,
    setDhikr,
    setBeadSkin,
    toggleHaptics,
    reset,
  };
}
