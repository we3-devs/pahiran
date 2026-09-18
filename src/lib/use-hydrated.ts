"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server rendering, true after hydration.
 *
 * Used by the cart UI: the cart lives in localStorage, so the server cannot
 * know it and the client must wait for hydration before rendering counts.
 * `useSyncExternalStore` gives the two snapshots without a setState effect.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
