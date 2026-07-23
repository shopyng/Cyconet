'use client';

/**
 * Subscribes to the OS "reduce motion" preference.
 *
 * A media query is an external store, so `useSyncExternalStore` is the right
 * tool rather than `useState` + `useEffect`. Copying the value into state
 * inside an effect causes an extra render pass on every mount and trips React's
 * `set-state-in-effect` lint rule; this reads the live value during render and
 * re-renders only when the preference actually changes.
 *
 * The server snapshot is `false` — assume motion is allowed while rendering on
 * the server, then correct on hydration if the user has opted out.
 */

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onStoreChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

/** Returns a primitive, so referential equality checks are safe. */
function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
