/** Brand-colour helpers. The accent is editable from the admin panel. */

export const DEFAULT_BRAND_COLOR = "#1c4b3c";

/** Accepts #rgb / #rrggbb, returns a normalised 6-digit hex or the fallback. */
export function normalizeHexColor(value: string | null | undefined, fallback = DEFAULT_BRAND_COLOR) {
  if (!value) return fallback;
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
  return fallback;
}

/** Relative luminance (WCAG) used to pick readable foreground text. */
function luminance(hex: string): number {
  const normalized = normalizeHexColor(hex);
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Black or white, whichever contrasts better against the brand colour. */
export function readableTextColor(hex: string): string {
  return luminance(hex) > 0.55 ? "#121211" : "#ffffff";
}
