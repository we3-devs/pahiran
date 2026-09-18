import { formatPrice } from "@/lib/format";
import type { CartItem, CheckoutDetails, StoreSettings } from "@/lib/types";

/**
 * WhatsApp checkout helpers.
 *
 * Orders are never persisted: the cart is turned into a formatted message that
 * is handed to WhatsApp, where the customer presses "Send" themselves.
 */

/** Strip everything but digits, then make sure the country code is present. */
export function normalizeWhatsappNumber(
  rawNumber: string | null | undefined,
  countryCode: string | null | undefined,
): string {
  let digits = (rawNumber ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const cc = (countryCode ?? "").replace(/\D/g, "");
  if (!cc) return digits;

  // International prefix written as 00.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(cc)) return digits;
  // Local format (0XXXXXXXXX) -> country code + subscriber number.
  if (digits.startsWith("0")) return `${cc}${digits.replace(/^0+/, "")}`;
  // Bare subscriber number -> prefix the country code.
  return `${cc}${digits}`;
}

export function buildOrderMessage(
  items: CartItem[],
  details: CheckoutDetails,
  settings: StoreSettings,
): string {
  const symbol = settings.currency_symbol || "Rs.";
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const lines: string[] = [];
  lines.push("🛍️ NEW ORDER");
  lines.push("");
  lines.push("Customer Details");
  lines.push("");
  lines.push(`Name: ${details.fullName.trim()}`);
  lines.push(`Phone: ${details.phone.trim()}`);
  lines.push(`Address: ${details.address.trim()}`);
  lines.push("");
  lines.push("Order Details");
  lines.push("");

  items.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    lines.push(`${index + 1}. ${item.name}`);
    if (item.size) lines.push(`   Size: ${item.size}`);
    if (item.color) lines.push(`   Color: ${item.color}`);
    lines.push(`   Qty: ${item.quantity}`);
    lines.push(`   Price: ${formatPrice(item.price, symbol)}`);
    lines.push(`   Subtotal: ${formatPrice(subtotal, symbol)}`);
    lines.push("");
  });

  lines.push(`Total: ${formatPrice(total, symbol)}`);

  const note = details.note.trim();
  if (note) {
    lines.push("");
    lines.push("Additional Note:");
    lines.push(note);
  }

  return lines.join("\n");
}

/** `https://wa.me/<number>?text=<url encoded message>` */
export function buildWhatsappLink(
  items: CartItem[],
  details: CheckoutDetails,
  settings: StoreSettings,
): string | null {
  const number = normalizeWhatsappNumber(
    settings.whatsapp,
    settings.whatsapp_country_code,
  );
  if (!number) return null;
  const message = buildOrderMessage(items, details, settings);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
