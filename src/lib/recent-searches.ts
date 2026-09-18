/**
 * Recent searches, kept in localStorage behind an external-store subscription
 * so the search dialog can read them with `useSyncExternalStore` (no state
 * syncing inside effects, and the list stays correct across tabs).
 */

const RECENT_KEY = "store-recent-searches";
const RECENT_EVENT = "store-recent-searches:changed";
const MAX_RECENT = 5;

export function subscribeRecentSearches(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECENT_EVENT, onChange);
  };
}

export function getRecentSearchesSnapshot(): string {
  try {
    return window.localStorage.getItem(RECENT_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Server render: there is no storage, so the list is simply empty. */
export function getRecentSearchesServerSnapshot(): string {
  return "";
}

export function parseRecentSearches(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;

  try {
    const next = [
      trimmed,
      ...parseRecentSearches(getRecentSearchesSnapshot()).filter((entry) => entry !== trimmed),
    ].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Private mode / storage disabled — searching still works.
  }
}
