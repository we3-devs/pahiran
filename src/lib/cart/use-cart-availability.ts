"use client";

import * as React from "react";

import { checkCartItems } from "@/lib/actions/cart";
import type { CartItem, CartLineStatus } from "@/lib/types";

export type CartAvailability = {
  /** A check is in flight for the current cart. */
  loading: boolean;
  /** A check completed and everything in the cart is orderable. */
  checked: boolean;
  /** The check itself could not run (offline, server error) — do not block on it. */
  failed: boolean;
  unavailableIds: string[];
  unavailableCount: number;
  statusOf: (productId: string) => CartLineStatus;
};

type CheckState = {
  /** The cart contents this result belongs to. */
  signature: string;
  failed: boolean;
  unavailableIds: string[];
};

function signatureOf(items: CartItem[]): string {
  return items
    .map((item) => `${item.productId}|${item.size ?? ""}|${item.color ?? ""}|${item.quantity}`)
    .join("~");
}

/**
 * Re-checks the cart against the database whenever its contents change, so a
 * product that went out of stock *after* it was added is flagged instead of
 * silently staying orderable.
 *
 * State is only ever set from the async callback: whether a result is current
 * is *derived* by comparing signatures, which keeps this free of effect-driven
 * render cascades.
 */
export function useCartAvailability(items: CartItem[]): CartAvailability {
  const [state, setState] = React.useState<CheckState | null>(null);

  const signature = signatureOf(items);
  const payload = React.useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    [items],
  );

  React.useEffect(() => {
    if (payload.length === 0) return;

    let cancelled = false;

    checkCartItems(payload)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          console.error("[cart] availability check failed:", result.error);
          setState({ signature, failed: true, unavailableIds: [] });
          return;
        }
        setState({ signature, failed: false, unavailableIds: result.unavailableIds });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[cart] availability check threw:", error);
        setState({ signature, failed: true, unavailableIds: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [payload, signature]);

  const fresh = state !== null && state.signature === signature;
  const unavailableIds = React.useMemo(
    () => (fresh ? (state?.unavailableIds ?? []) : []),
    [fresh, state],
  );

  const unavailable = React.useMemo(() => new Set(unavailableIds), [unavailableIds]);

  const statusOf = React.useCallback(
    (productId: string): CartLineStatus => (unavailable.has(productId) ? "out_of_stock" : "ok"),
    [unavailable],
  );

  const unavailableCount = React.useMemo(
    () => items.filter((item) => unavailable.has(item.productId)).length,
    [items, unavailable],
  );

  return {
    loading: payload.length > 0 && !fresh,
    checked: payload.length === 0 || (fresh && !state?.failed),
    failed: fresh && state.failed,
    unavailableIds,
    unavailableCount,
    statusOf,
  };
}
