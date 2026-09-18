/** Formatting and small pure helpers shared by the storefront and admin. */

export function formatPrice(amount: number, symbol = "Rs."): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const hasDecimals = rounded % 1 !== 0;
  return `${symbol} ${rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Products created within the last 30 days are flagged as new. */
export function isNewProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Turns "1, 2" / "S,M" style admin input into a clean list. */
export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Canonical ordering for letter sizes so filters read S, M, L, XL. */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "4XL"];

/**
 * Orders the option values that exist in the catalogue: letter sizes in
 * clothing order, then numeric sizes ascending, then anything else A–Z.
 */
export function sortOptionValues(values: string[]): string[] {
  const rank = (value: string) => {
    const index = SIZE_ORDER.indexOf(value.toUpperCase());
    if (index >= 0) return index;
    if (/^\d+(\.\d+)?$/.test(value.trim())) return SIZE_ORDER.length + Number(value);
    return SIZE_ORDER.length + 1000 + value.charCodeAt(0);
  };

  return [...new Set(values)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function truncate(value: string, length = 160): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trimEnd()}…`;
}
