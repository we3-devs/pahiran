"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  AVAILABILITY_OPTIONS,
  buildShopQuery,
  countActiveFilters,
  EMPTY_FILTERS,
  toggleValue,
  type AvailabilityFilter,
  type ProductSort,
  type ShopFilters,
} from "@/lib/shop-filters";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ShopFacets = {
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

type FieldsProps = {
  value: ShopFilters;
  setValue: React.Dispatch<React.SetStateAction<ShopFilters>>;
  commit: (next: ShopFilters) => void;
  /** Instant = desktop sidebar (apply on change); draft = mobile sheet. */
  instant: boolean;
  categories: Pick<Category, "id" | "name" | "slug">[];
  facets: ShopFacets;
  idPrefix: string;
};

function Group({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <fieldset className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend id={id} className="mb-0.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
        {title}
      </legend>
      <div className="mt-2.5">{children}</div>
    </fieldset>
  );
}

function OptionButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-2 text-[13px] font-medium transition-colors",
        active ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * The filter controls, shared by the desktop sidebar and the mobile sheet so
 * both stay in sync. Only the option values that exist in the catalogue are
 * rendered (anything else is noise).
 */
function FilterFields({ value, setValue, commit, instant, categories, facets, idPrefix }: FieldsProps) {
  const update = (next: ShopFilters, immediate = true) => {
    setValue(next);
    if (instant && immediate) commit(next);
  };

  const min = value.minPrice;
  const max = value.maxPrice;

  return (
    <div className="space-y-5">
      {categories.length > 0 ? (
        <Group title="Category" id={`${idPrefix}-category`}>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              active={!value.category}
              onClick={() => update({ ...value, category: "" })}
            >
              All
            </OptionButton>
            {categories.map((category) => (
              <OptionButton
                key={category.id}
                active={value.category === category.slug}
                onClick={() => update({ ...value, category: category.slug })}
              >
                {category.name}
              </OptionButton>
            ))}
          </div>
        </Group>
      ) : null}

      <Group title="Price" id={`${idPrefix}-price`}>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-price-min`}>
            Minimum price
          </label>
          <Input
            id={`${idPrefix}-price-min`}
            inputMode="numeric"
            value={min}
            onChange={(event) =>
              update({ ...value, minPrice: event.target.value.replace(/[^\d.]/g, "") }, false)
            }
            placeholder={facets.minPrice != null ? String(Math.floor(facets.minPrice)) : "Min"}
            className="h-10"
          />
          <span aria-hidden className="text-muted">
            —
          </span>
          <label className="sr-only" htmlFor={`${idPrefix}-price-max`}>
            Maximum price
          </label>
          <Input
            id={`${idPrefix}-price-max`}
            inputMode="numeric"
            value={max}
            onChange={(event) =>
              update({ ...value, maxPrice: event.target.value.replace(/[^\d.]/g, "") }, false)
            }
            placeholder={facets.maxPrice != null ? String(Math.ceil(facets.maxPrice)) : "Max"}
            className="h-10"
          />
          {instant ? (
            <Button variant="outline" size="sm" onClick={() => commit(value)}>
              Apply
            </Button>
          ) : null}
        </div>
      </Group>

      {facets.sizes.length > 0 ? (
        <Group title="Size" id={`${idPrefix}-size`}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <OptionButton
                key={size}
                active={value.sizes.includes(size)}
                onClick={() => update({ ...value, sizes: toggleValue(value.sizes, size) })}
                className="min-w-10 px-2.5"
              >
                {size}
              </OptionButton>
            ))}
          </div>
        </Group>
      ) : null}

      {facets.colors.length > 0 ? (
        <Group title="Colour" id={`${idPrefix}-color`}>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => (
              <OptionButton
                key={color}
                active={value.colors.includes(color)}
                onClick={() => update({ ...value, colors: toggleValue(value.colors, color) })}
              >
                {color}
              </OptionButton>
            ))}
          </div>
        </Group>
      ) : null}

      <Group title="Availability" id={`${idPrefix}-availability`}>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              active={value.availability === option.value}
              onClick={() => update({ ...value, availability: option.value as AvailabilityFilter })}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </Group>
    </div>
  );
}

type SharedProps = {
  categories: Pick<Category, "id" | "name" | "slug">[];
  facets: ShopFacets;
  filters: ShopFilters;
  query: string;
  sort: ProductSort;
};

/** Desktop: always visible beside the grid, applies as soon as you tap. */
export function ShopFiltersSidebar({ categories, facets, filters, query, sort }: SharedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = React.useState<ShopFilters>(filters);

  const commit = (next: ShopFilters) =>
    router.push(`/shop${buildShopQuery({ query, sort, filters: next, page: 1 })}`, {
      scroll: false,
    });

  const active = countActiveFilters(filters);

  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Filters</h2>
        {active > 0 ? (
          <button
            type="button"
            onClick={() => {
              setValue(EMPTY_FILTERS);
              commit(EMPTY_FILTERS);
              toast("Filters cleared", { variant: "info" });
            }}
            className="text-[12px] font-medium text-muted underline underline-offset-4 hover:text-ink"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-5">
        <FilterFields
          value={value}
          setValue={setValue}
          commit={commit}
          instant
          categories={categories}
          facets={facets}
          idPrefix="sidebar"
        />
      </div>
    </aside>
  );
}

/** Mobile: a one-handed bottom sheet with explicit Apply / Clear. */
export function ShopFiltersSheet({ categories, facets, filters, query, sort }: SharedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<ShopFilters>(filters);
  const active = countActiveFilters(filters);

  const commit = (next: ShopFilters) => {
    setOpen(false);
    router.push(`/shop${buildShopQuery({ query, sort, filters: next, page: 1 })}`, {
      scroll: false,
    });
    const applied = countActiveFilters(next);
    toast(applied === 0 ? "Filters cleared" : "Filters applied", { variant: "info" });
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        onClick={() => {
          setValue(filters);
          setOpen(true);
        }}
        className="shrink-0"
      >
        <SlidersHorizontal aria-hidden />
        Filter
        {active > 0 ? (
          <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-canvas">
            {active}
          </span>
        ) : null}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Filters"
        className="sm:max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setValue(EMPTY_FILTERS)}
              className="mr-auto"
            >
              Clear all
            </Button>
            <Button variant="dark" onClick={() => commit(value)}>
              Apply filters
            </Button>
          </>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
          <FilterFields
            value={value}
            setValue={setValue}
            commit={commit}
            instant={false}
            categories={categories}
            facets={facets}
            idPrefix="sheet"
          />
        </div>
      </Dialog>
    </>
  );
}
