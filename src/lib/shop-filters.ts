import type { Category } from "@/lib/types";

/**
 * The filter and sort vocabulary of the shop, shared by the server page, the
 * URL parser and the client controls so the three can never drift apart.
 * Pure module — safe to import from both server and client components.
 */

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

export type ProductSort = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: ProductSort = "featured";

export type AvailabilityFilter = "all" | "in_stock" | "out_of_stock";

export const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_stock", label: "In stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

export type ShopFilters = {
  /** Category slug; empty string means every category. */
  category: string;
  sizes: string[];
  colors: string[];
  /** Raw input values — kept as text so a half-typed number does not reset. */
  minPrice: string;
  maxPrice: string;
  availability: AvailabilityFilter;
};

export const EMPTY_FILTERS: ShopFilters = {
  category: "",
  sizes: [],
  colors: [],
  minPrice: "",
  maxPrice: "",
  availability: "all",
};

export type ShopSearchParams = {
  q?: string;
  sort?: string;
  category?: string;
  size?: string;
  color?: string;
  min?: string;
  max?: string;
  availability?: string;
  page?: string;
};

export type ParsedShopParams = {
  query: string;
  sort: ProductSort;
  filters: ShopFilters;
  page: number;
};

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Keeps only digits, a leading minus and one decimal point. */
function cleanNumber(value: string | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  return cleaned;
}

export function isProductSort(value: string | undefined): value is ProductSort {
  return Boolean(value) && SORT_OPTIONS.some((option) => option.value === value);
}

export function isAvailability(value: string | undefined): value is AvailabilityFilter {
  return value === "all" || value === "in_stock" || value === "out_of_stock";
}

export function parseShopParams(params: ShopSearchParams): ParsedShopParams {
  return {
    query: params.q?.trim() ?? "",
    sort: isProductSort(params.sort) ? params.sort : DEFAULT_SORT,
    filters: {
      category: params.category?.trim() ?? "",
      sizes: splitList(params.size),
      colors: splitList(params.color),
      minPrice: cleanNumber(params.min),
      maxPrice: cleanNumber(params.max),
      availability: isAvailability(params.availability) ? params.availability : "all",
    },
    page: Math.max(1, Number(params.page) || 1),
  };
}

/** Builds the `/shop` URL for a given filter state, omitting defaults. */
export function buildShopQuery({
  query = "",
  sort = DEFAULT_SORT,
  filters = EMPTY_FILTERS,
  page = 1,
}: {
  query?: string;
  sort?: ProductSort;
  filters?: ShopFilters;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (filters.category) search.set("category", filters.category);
  if (filters.sizes.length > 0) search.set("size", filters.sizes.join(","));
  if (filters.colors.length > 0) search.set("color", filters.colors.join(","));
  if (filters.minPrice) search.set("min", filters.minPrice);
  if (filters.maxPrice) search.set("max", filters.maxPrice);
  if (filters.availability !== "all") search.set("availability", filters.availability);
  if (sort !== DEFAULT_SORT) search.set("sort", sort);
  if (page > 1) search.set("page", String(page));

  const value = search.toString();
  return value ? `?${value}` : "";
}

export function countActiveFilters(filters: ShopFilters): number {
  return (
    (filters.category ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.availability !== "all" ? 1 : 0)
  );
}

export type FilterChip = {
  key: string;
  label: string;
  /** Filters with just this one removed. */
  next: ShopFilters;
};

/** Removable chips shown above the grid for every active filter. */
export function activeFilterChips(
  filters: ShopFilters,
  categories: Pick<Category, "name" | "slug">[],
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.category) {
    const name = categories.find((entry) => entry.slug === filters.category)?.name ?? filters.category;
    chips.push({
      key: "category",
      label: name,
      next: { ...filters, category: "" },
    });
  }

  filters.sizes.forEach((size) => {
    chips.push({
      key: `size:${size}`,
      label: `Size ${size}`,
      next: { ...filters, sizes: filters.sizes.filter((entry) => entry !== size) },
    });
  });

  filters.colors.forEach((color) => {
    chips.push({
      key: `color:${color}`,
      label: color,
      next: { ...filters, colors: filters.colors.filter((entry) => entry !== color) },
    });
  });

  if (filters.minPrice) {
    chips.push({
      key: "min",
      label: `From ${Number(filters.minPrice).toLocaleString("en-US")}`,
      next: { ...filters, minPrice: "" },
    });
  }

  if (filters.maxPrice) {
    chips.push({
      key: "max",
      label: `Up to ${Number(filters.maxPrice).toLocaleString("en-US")}`,
      next: { ...filters, maxPrice: "" },
    });
  }

  if (filters.availability !== "all") {
    chips.push({
      key: "availability",
      label: AVAILABILITY_OPTIONS.find((option) => option.value === filters.availability)?.label ?? "",
      next: { ...filters, availability: "all" },
    });
  }

  return chips;
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}
