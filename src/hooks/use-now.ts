import * as React from 'react';
import { AppState } from 'react-native';

/**
 * A ticking `Date.now()`, for the countdown display only.
 *
 * Two things keep this cheap:
 *
 * - It is meant to be called from the smallest leaf that needs it, so a tick
 *   re-renders a couple of `Text` nodes rather than a whole screen.
 * - It stops entirely while the app is backgrounded, and re-reads the wall
 *   clock on resume, so a backgrounded app runs no timers at all and is correct
 *   on the first frame after it comes back.
 *
 * Consumers should recompute a remaining time from this rather than decrement a
 * counter -- that stays right across drift, throttling and clock changes.
 */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function stop() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function start() {
      stop();
      setNow(Date.now());
      // Align the first tick to the interval boundary so displayed seconds flip
      // with the wall clock instead of drifting by however long mount took.
      timeoutId = setTimeout(
        () => {
          setNow(Date.now());
          intervalId = setInterval(() => setNow(Date.now()), intervalMs);
        },
        intervalMs - (Date.now() % intervalMs)
      );
    }

    if (AppState.currentState === 'active') start();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs, enabled]);

  return now;
}
