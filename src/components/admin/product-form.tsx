"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ImageUploader } from "@/components/admin/image-uploader";
import { OptionChips } from "@/components/admin/option-chips";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { saveProduct, type ProductFormValues } from "@/lib/actions/products";
import { BUCKETS, isSupabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { hasErrors, validateProduct, type FieldErrors } from "@/lib/validation";

const SIZE_PRESETS = ["S", "M", "L", "XL", "XXL"];
const COLOR_PRESETS = ["Black", "White", "Blue"];

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  images: string[];
  sizes: string[];
  colors: string[];
  active: boolean;
  featured: boolean;
};

function initialState(product: Product | null, categories: Category[]): FormState {
  if (product) {
    return {
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      compareAtPrice: product.compare_at_price ? String(product.compare_at_price) : "",
      categoryId: product.category_id ?? "",
      images: product.images ?? [],
      sizes: product.sizes ?? [],
      colors: product.colors ?? [],
      active: product.active,
      featured: product.featured,
    };
  }

  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    compareAtPrice: "",
    categoryId: categories[0]?.id ?? "",
    images: [],
    sizes: [],
    colors: [],
    active: true,
    featured: false,
  };
}

/** The exact same component is used for "Add product" and "Edit product". */
export function ProductForm({
  categories,
  product = null,
}: {
  categories: Category[];
  product?: Product | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState<FormState>(() => initialState(product, categories));
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const slugTouched = React.useRef(Boolean(product));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const onNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched.current ? current.slug : slugify(value),
    }));
    setErrors((current) => ({ ...current, name: "", slug: "" }));
  };

  const buildValues = (): ProductFormValues => ({
    id: product?.id ?? null,
    name: form.name,
    slug: form.slug,
    description: form.description,
    price: form.price,
    compareAtPrice: form.compareAtPrice,
    categoryId: form.categoryId,
    images: form.images,
    sizes: form.sizes,
    colors: form.colors,
    featured: form.featured,
    active: form.active,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const values = buildValues();

    const clientErrors = validateProduct(values);
    setErrors(clientErrors);
    setFormError(null);

    if (hasErrors(clientErrors)) {
      setFormError("Please fix the highlighted fields.");
      document.getElementById(Object.keys(clientErrors)[0])?.focus();
      return;
    }

    startTransition(async () => {
      const result = await saveProduct(values);

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        toast(result.error);
        return;
      }

      toast(product ? "Product updated" : "Product added");
      router.push("/admin/products");
      router.refresh();
    });
  };

  const noCategories = categories.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {!isSupabaseConfigured() ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          Supabase is not configured — saving is disabled until your project keys are added.
        </p>
      ) : null}

      {noCategories ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm">
          You need at least one category before adding products.{" "}
          <Link href="/admin/categories" className="underline underline-offset-4">
            Create a category
          </Link>
          .
        </p>
      ) : null}

      <section className="space-y-5">
        <h2 className="font-display text-lg">Basic information</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Product name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Premium Cotton Shirt"
              invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            <FieldError id="name-error" message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => {
                slugTouched.current = true;
                update("slug", slugify(event.target.value));
              }}
              placeholder="premium-cotton-shirt"
              invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : "slug-help"}
            />
            {errors.slug ? (
              <FieldError id="slug-error" message={errors.slug} />
            ) : (
              <p id="slug-help" className="text-[12px] text-muted">
                Used in the product URL: /product/{form.slug || "your-product"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <Select
              id="categoryId"
              value={form.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
              invalid={Boolean(errors.categoryId)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <FieldError id="categoryId-error" message={errors.categoryId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              inputMode="decimal"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              placeholder="1499"
              invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "price-error" : undefined}
            />
            <FieldError id="price-error" message={errors.price} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Original price (optional)</Label>
            <Input
              id="compareAtPrice"
              inputMode="decimal"
              value={form.compareAtPrice}
              onChange={(event) => update("compareAtPrice", event.target.value)}
              placeholder="1999"
              invalid={Boolean(errors.compareAtPrice)}
              aria-describedby={errors.compareAtPrice ? "compare-error" : "compare-help"}
            />
            {errors.compareAtPrice ? (
              <FieldError id="compare-error" message={errors.compareAtPrice} />
            ) : (
              <p id="compare-help" className="text-[12px] text-muted">
                Shown struck through with a discount badge.
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Fabric, fit, care instructions…"
              className="min-h-32"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Images</h2>
        <ImageUploader
          bucket={BUCKETS.products}
          folderPrefix="products"
          value={form.images}
          onChange={(images) => update("images", images)}
          invalid={Boolean(errors.images)}
          help="The first image is the primary one. Images are optimised in your browser before upload."
        />
        <FieldError id="images-error" message={errors.images} />
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <OptionChips
          label="Sizes"
          presetLabel="Common sizes"
          presets={SIZE_PRESETS}
          value={form.sizes}
          onChange={(sizes) => update("sizes", sizes)}
          placeholder="e.g. 32"
          help="Leave empty for one-size products — the size picker is hidden."
        />
        <OptionChips
          label="Colours"
          presetLabel="Common colours"
          presets={COLOR_PRESETS}
          value={form.colors}
          onChange={(colors) => update("colors", colors)}
          placeholder="e.g. Rust"
          help="Leave empty if the product has no colour options."
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Visibility</h2>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-4">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-[13px] text-muted">Visible on the storefront and in searches.</p>
          </div>
          <Switch
            checked={form.active}
            onCheckedChange={(checked) => update("active", checked)}
            aria-label="Active"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-4">
          <div>
            <p className="text-sm font-medium">Featured</p>
            <p className="text-[13px] text-muted">
              Included in the homepage featured collection.
            </p>
          </div>
          <Switch
            checked={form.featured}
            onCheckedChange={(checked) => update("featured", checked)}
            aria-label="Featured"
          />
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur-sm sm:mx-0 sm:px-0">
        <FieldError id="form-error" message={formError} />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button type="submit" variant="dark" size="lg" disabled={pending || noCategories}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : product ? "Save changes" : "Save Product"}
          </Button>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-muted underline underline-offset-4 hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
