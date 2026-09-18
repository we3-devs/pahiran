"use client";

import { create } from "zustand";

/**
 * The search dialog is opened from two places (the header button and the
 * mobile drawer entry), so its open state lives in a tiny store rather than
 * being threaded through props.
 */
type SearchStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useSearchStore = create<SearchStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function openSearch() {
  useSearchStore.getState().setOpen(true);
}
