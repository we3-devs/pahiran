import { slugify } from "@/lib/format";
import type { CheckoutDetails } from "@/lib/types";

export type FieldErrors = Record<string, string>;

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  active: boolean;
  inStock: boolean;
};

export type CategoryInput = {
  name: string;
  slug: string;
  description: string;
  image: string | null;
  active: boolean;
  sortOrder: string;
};

/** Parses a numeric input, returning null when it is not a valid number. */
export function parseAmount(value: string): number | null {
  const trimmed = value.replace(/,/g, "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100) / 100;
}

export function validateProduct(input: ProductInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) errors.name = "Product name is required.";
  else if (input.name.trim().length > 120) errors.name = "Keep the name under 120 characters.";

  if (!input.slug.trim()) errors.slug = "Slug is required.";
  else if (!/^[a-z0-9-]+$/.test(input.slug))
    errors.slug = "Use lowercase letters, numbers and dashes only.";

  const price = parseAmount(input.price);
  if (price === null || price < 0) errors.price = "Enter a valid price.";
  else if (price === 0) errors.price = "Price must be greater than zero.";

  if (input.compareAtPrice.trim()) {
    const compareAt = parseAmount(input.compareAtPrice);
    if (compareAt === null || compareAt < 0)
      errors.compareAtPrice = "Enter a valid original price.";
    else if (price !== null && compareAt > 0 && compareAt <= price)
      errors.compareAtPrice = "Original price must be higher than the selling price.";
  }

  if (!input.categoryId) errors.categoryId = "Choose a category.";

  if (input.images.length === 0) errors.images = "Upload at least one product image.";

  if (input.sizes.length > 20) errors.sizes = "That is a lot of sizes — keep it under 20.";
  else if (input.sizes.some((size) => !size.trim() || size.length > 20))
    errors.sizes = "Sizes must be under 20 characters.";

  if (input.colors.length > 20) errors.colors = "That is a lot of colours — keep it under 20.";
  else if (input.colors.some((color) => !color.trim() || color.length > 30))
    errors.colors = "Colours must be under 30 characters.";

  return errors;
}

export function validateCategory(input: CategoryInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = "Category name is required.";
  else if (input.name.trim().length > 60) errors.name = "Keep the name under 60 characters.";

  if (!input.slug.trim()) errors.slug = "Slug is required.";
  else if (!/^[a-z0-9-]+$/.test(input.slug))
    errors.slug = "Use lowercase letters, numbers and dashes only.";

  if (input.sortOrder.trim()) {
    const order = Number(input.sortOrder);
    if (!Number.isInteger(order)) errors.sortOrder = "Enter a whole number.";
  }

  return errors;
}

export function validateCheckout(details: CheckoutDetails): FieldErrors {
  const errors: FieldErrors = {};

  if (!details.fullName.trim()) errors.fullName = "Please enter your full name.";
  else if (details.fullName.trim().length < 2) errors.fullName = "Please enter your full name.";

  const phoneDigits = details.phone.replace(/\D/g, "");
  if (!phoneDigits) errors.phone = "Please enter your phone number.";
  else if (phoneDigits.length < 7 || phoneDigits.length > 15)
    errors.phone = "Enter a valid phone number (7–15 digits).";

  if (!details.address.trim()) errors.address = "Please enter your delivery address.";
  else if (details.address.trim().length < 5)
    errors.address = "Please enter a complete delivery address.";

  if (details.note.length > 500) errors.note = "Please keep the note under 500 characters.";

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Slug suggestion used by the admin forms when the name changes. */
export function suggestSlug(name: string, current?: string): string {
  if (current && current.trim()) return current;
  return slugify(name);
}
