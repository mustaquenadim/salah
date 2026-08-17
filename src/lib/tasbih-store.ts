import { AppState } from 'react-native';

import { DEFAULT_BEAD_SKIN, isBeadSkinId, type BeadSkinId } from '@/lib/bead-skins';
import { findDhikr } from '@/lib/dhikr';
import { STORAGE_KEYS, readJson, writeJson } from '@/lib/storage';

/**
 * Module-level store for the tasbih counter, read through
 * `useSyncExternalStore` -- same shape as `settings-store.ts` and
 * `reminder-store.ts`, for the same reasons: persisted, singular, and needed
 * outside the tree.
 *
 * The one departure from those two is that the write is debounced. They persist
 * on every `emit` because their state changes when a user opens a picker; this
 * one changes on every tap, and a session of a hundred dhikr would otherwise
 * queue a hundred AsyncStorage round-trips.
 */

export type TasbihState = {
  /** Position in the current loop, `0` through `target` inclusive. */
  count: number;
  /** Completed rounds of `target`. Only an explicit reset clears it. */
  loops: number;
  target: number;
  /**
   * Every count ever made this session, never rolled over.
   *
   * Stored rather than derived from `loops * target + count`: that expression
   * is not monotonic at a loop boundary, where `loops` has already advanced
   * while `count` is still resting on the target, and it breaks outright if the
   * target changes mid-session. The bead strand needs a number that only ever
   * goes up by one, and this is it.
   */
  strokes: number;
  /** Null until the user picks one -- the counter works without a dhikr. */
  dhikrId: string | null;
  beadSkin: BeadSkinId;
  hapticsEnabled: boolean;
  /**
   * Set once the user picks a target by hand. After that, choosing a dhikr no
   * longer adopts its `defaultTarget` -- the same "don't overwrite a deliberate
   * choice" guard as `userOverridden` in `settings-store.ts`.
   */
  targetOverridden: boolean;
};

export const DEFAULT_TARGET = 33;
/** Above this a strand is meaningless and the LUT window gets silly. */
export const MAX_TARGET = 1000;

const DEFAULT_STATE: TasbihState = {
  count: 0,
  loops: 0,
  strokes: 0,
  target: DEFAULT_TARGET,
  dhikrId: null,
  beadSkin: DEFAULT_BEAD_SKIN,
  hapticsEnabled: true,
  targetOverridden: false,
};

let snapshot: TasbihState = DEFAULT_STATE;
const listeners = new Set<() => void>();

let initialized = false;

/**
 * How long a change may sit in memory before it reaches disk.
 *
 * Long enough that rapid counting collapses into a single write, short enough
 * that a crash loses at most a second of dhikr. Backgrounding flushes
 * immediately, so the only way to lose anything is a hard crash mid-count.
 */
const PERSIST_DELAY = 600;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  void writeJson(STORAGE_KEYS.tasbih, snapshot);
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flush, PERSIST_DELAY);
}

function emit(next: TasbihState): void {
  // Replaced wholesale, never mutated: `getSnapshot` has to return a stable
  // object identity between changes or `useSyncExternalStore` loops forever.
  snapshot = next;
  for (const listener of listeners) listener();
  schedulePersist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): TasbihState {
  return snapshot;
}

/**
 * Coerces a stored payload into something renderable.
 *
 * Storage is versioned, so this is not migration -- it is defence against a
 * half-written or hand-edited value. A `target` of 0 would divide by zero in
 * the strand, and a `dhikrId` for an entry since removed would leave the card
 * naming nothing.
 */
function sanitize(state: TasbihState): TasbihState {
  const target = clampTarget(state.target);
  return {
    // Inclusive of `target`: a finished loop rests on its own last bead.
    count: Number.isFinite(state.count)
      ? Math.min(Math.max(0, Math.floor(state.count)), target)
      : 0,
    loops: Number.isFinite(state.loops) ? Math.max(0, Math.floor(state.loops)) : 0,
    strokes: Number.isFinite(state.strokes) ? Math.max(0, Math.floor(state.strokes)) : 0,
    target,
    dhikrId: state.dhikrId && findDhikr(state.dhikrId) ? state.dhikrId : null,
    beadSkin: isBeadSkinId(state.beadSkin) ? state.beadSkin : DEFAULT_BEAD_SKIN,
    hapticsEnabled: state.hapticsEnabled !== false,
    targetOverridden: state.targetOverridden === true,
  };
}

function clampTarget(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TARGET;
  return Math.min(Math.max(1, Math.floor(value)), MAX_TARGET);
}

export function initTasbih(): void {
  if (initialized) return;
  initialized = true;

  // The debounce window is longer than the gap between a tap and a swipe-away,
  // so the pending write has to be forced out as the app leaves the foreground.
  AppState.addEventListener('change', (status) => {
    if (status !== 'active' && persistTimer) flush();
  });

  void (async () => {
    const stored = await readJson<Partial<TasbihState>>(STORAGE_KEYS.tasbih);
    if (!stored) return;
    // Spread over the defaults so a field added in a later version is populated
    // rather than undefined.
    emit(sanitize({ ...DEFAULT_STATE, ...stored }));
  })();
}

/** What an increment did, so the caller can pick the matching haptic. */
export type TickResult = 'tick' | 'loop';

/**
 * Counts one, rolling over into the next loop past the target.
 *
 * The count comes to rest *on* the target rather than skipping it. Rolling at
 * `target` would mean 33 never appears on screen -- the thirty-third tap would
 * jump straight from 32 to 0, and the one number the user is counting towards
 * is the one they never get to see. So the tap that reaches the target displays
 * it and credits the loop; the tap after that starts the next round at 1.
 *
 * Auto-continues rather than stopping: a tasbih of 33 is usually one third of a
 * post-salah set, and making the user tap a "next" button between them would
 * interrupt exactly the thing being counted.
 */
export function increment(): TickResult {
  // Resting on a completed loop: this tap opens the next one.
  if (snapshot.count >= snapshot.target) {
    emit({ ...snapshot, count: 1, strokes: snapshot.strokes + 1 });
    return 'tick';
  }

  const next = snapshot.count + 1;
  const completes = next >= snapshot.target;

  emit({
    ...snapshot,
    count: next,
    loops: completes ? snapshot.loops + 1 : snapshot.loops,
    strokes: snapshot.strokes + 1,
  });

  return completes ? 'loop' : 'tick';
}

/**
 * Undoes one count.
 *
 * Undoing the tap that completed a loop also withdraws the loop credit --
 * otherwise re-counting it would award the same loop twice. Floors at zero
 * rather than unwinding into the loop before that one, which is already
 * finished and gone from the screen.
 */
export function decrement(): void {
  if (snapshot.count === 0) return;

  const undoesLoop = snapshot.count >= snapshot.target;

  emit({
    ...snapshot,
    count: snapshot.count - 1,
    loops: undoesLoop ? Math.max(0, snapshot.loops - 1) : snapshot.loops,
    strokes: Math.max(0, snapshot.strokes - 1),
  });
}

/** A deliberate user change. Pins the target against later dhikr defaults. */
export function setTarget(value: number): void {
  const target = clampTarget(value);
  if (target === snapshot.target && snapshot.targetOverridden) return;

  emit({
    ...snapshot,
    target,
    // Lowering the target below the current count would otherwise leave the
    // counter reading past its own limit until the next tap.
    count: Math.min(snapshot.count, target),
    targetOverridden: true,
  });
}

export function setDhikr(id: string | null): void {
  if (id === snapshot.dhikrId) return;

  const dhikr = id ? findDhikr(id) : null;
  // Adopting the traditional count is a convenience, not an override: once the
  // user has set a target by hand, it survives every later dhikr change.
  const target =
    dhikr && !snapshot.targetOverridden ? clampTarget(dhikr.defaultTarget) : snapshot.target;

  emit({
    ...snapshot,
    dhikrId: dhikr ? dhikr.id : null,
    target,
    count: Math.min(snapshot.count, target),
  });
}

export function setBeadSkin(id: BeadSkinId): void {
  if (id === snapshot.beadSkin) return;
  emit({ ...snapshot, beadSkin: id });
}

export function setHapticsEnabled(enabled: boolean): void {
  if (enabled === snapshot.hapticsEnabled) return;
  emit({ ...snapshot, hapticsEnabled: enabled });
}

export function toggleHaptics(): void {
  setHapticsEnabled(!snapshot.hapticsEnabled);
}

/** Clears the session. Written through immediately -- it is not a hot path. */
export function reset(): void {
  if (snapshot.count === 0 && snapshot.loops === 0) return;
  emit({ ...snapshot, count: 0, loops: 0, strokes: 0 });
  flush();
}
