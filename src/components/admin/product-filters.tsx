"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input, Select } from "@/components/ui/input";
import type { Category } from "@/lib/types";

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function ProductFilters({
  categories,
  search,
  status,
  availability,
  categoryId,
}: {
  categories: Pick<Category, "id" | "name">[];
  search: string;
  status: string;
  availability: string;
  categoryId: string;
}) {
  const router = useRouter();
  // Initialised from the URL; the page remounts this component when the search
  // term changes, so no effect-based syncing is needed.
  const [term, setTerm] = React.useState(search);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative w-full sm:max-w-xs"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(
            `/admin/products${buildQuery({ q: term, status, availability, category: categoryId })}`,
          );
        }}
      >
        <label htmlFor="admin-product-search" className="sr-only">
          Search products
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          id="admin-product-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search products"
          className="pl-10"
        />
      </form>

      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="admin-status" className="sr-only">
            Filter by status
          </label>
          <Select
            id="admin-status"
            value={status}
            className="h-10 w-auto min-w-36"
            onChange={(event) =>
              router.push(
                `/admin/products${buildQuery({
                  q: search,
                  status: event.target.value,
                  availability,
                  category: categoryId,
                })}`,
              )
            }
          >
            <option value="all">All products</option>
            <option value="active">Active only</option>
            <option value="draft">Hidden only</option>
            <option value="featured">Featured only</option>
          </Select>
        </div>

        <div>
          <label htmlFor="admin-availability" className="sr-only">
            Filter by availability
          </label>
          <Select
            id="admin-availability"
            value={availability}
            className="h-10 w-auto min-w-36"
            onChange={(event) =>
              router.push(
                `/admin/products${buildQuery({
                  q: search,
                  status,
                  availability: event.target.value,
                  category: categoryId,
                })}`,
              )
            }
          >
            <option value="all">Any availability</option>
            <option value="in_stock">In stock only</option>
            <option value="out_of_stock">Out of stock only</option>
          </Select>
        </div>

        <div>
          <label htmlFor="admin-category" className="sr-only">
            Filter by category
          </label>
          <Select
            id="admin-category"
            value={categoryId}
            className="h-10 w-auto min-w-40"
            onChange={(event) =>
              router.push(
                `/admin/products${buildQuery({
                  q: search,
                  status,
                  availability,
                  category: event.target.value,
                })}`,
              )
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
