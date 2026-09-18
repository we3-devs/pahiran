"use server";

import { getSearchSuggestions } from "@/lib/data/products";
import type { SearchSuggestion } from "@/lib/types";

/** Live suggestions for the header search box (debounced on the client). */
export async function quickSearch(term: string): Promise<SearchSuggestion[]> {
  const trimmed = term.trim().slice(0, 60);
  if (trimmed.length < 2) return [];

  try {
    return await getSearchSuggestions(trimmed, 6);
  } catch (error) {
    console.error("[search] suggestions failed:", error);
    return [];
  }
}
