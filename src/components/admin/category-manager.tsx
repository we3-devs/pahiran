"use client";

import { LoaderCircle, Pencil, Plus, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

import { SingleImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { saveCategory, deleteCategory, setCategoryActive } from "@/lib/actions/categories";
import { BUCKETS } from "@/lib/env";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";
import { hasErrors, validateCategory, type FieldErrors } from "@/lib/validation";

type FormState = {
  name: string;
  slug: string;
  description: string;
  image: string | null;
  active: boolean;
  sortOrder: string;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  image: null,
  active: true,
  sortOrder: "0",
};

function CategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category: Category | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<FormState>(() =>
    category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image: category.image,
          active: category.active,
          sortOrder: String(category.sort_order ?? 0),
        }
      : EMPTY,
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const slugTouched = React.useRef(Boolean(category));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const values = { id: category?.id ?? null, ...form };

    const clientErrors = validateCategory(values);
    setErrors(clientErrors);
    setFormError(null);

    if (hasErrors(clientErrors)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    startTransition(async () => {
      const result = await saveCategory(values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        toast(result.error, { variant: "error" });
        return;
      }
      toast(category ? "Category updated successfully" : "Category added successfully", {
        description: values.name.trim(),
      });
      onSaved();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="category-name">Name *</Label>
        <Input
          id="category-name"
          value={form.name}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({
              ...current,
              name: value,
              slug: slugTouched.current ? current.slug : slugify(value),
            }));
            setErrors((current) => ({ ...current, name: "", slug: "" }));
          }}
          placeholder="Men"
          invalid={Boolean(errors.name)}
        />
        <FieldError id="category-name-error" message={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug *</Label>
          <Input
            id="category-slug"
            value={form.slug}
            onChange={(event) => {
              slugTouched.current = true;
              update("slug", slugify(event.target.value));
            }}
            placeholder="men"
            invalid={Boolean(errors.slug)}
          />
          <FieldError id="category-slug-error" message={errors.slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-order">Order</Label>
          <Input
            id="category-order"
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(event) => update("sortOrder", event.target.value)}
            placeholder="1"
            invalid={Boolean(errors.sortOrder)}
          />
          <FieldError id="category-order-error" message={errors.sortOrder} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Short line shown on the category card and page."
        />
      </div>

      <SingleImageUploader
        bucket={BUCKETS.categories}
        folderPrefix="categories"
        label="Category image"
        value={form.image}
        onChange={(url) => update("image", url)}
        help="Square images look best in the category grid."
      />

      <label className="flex items-center gap-3 rounded-lg border border-line p-3">
        <Switch
          checked={form.active}
          onCheckedChange={(checked) => update("active", checked)}
          aria-label="Category active"
        />
        <span className="text-sm">
          Active
          <span className="block text-[12px] text-muted">
            Inactive categories are hidden from the storefront.
          </span>
        </span>
      </label>

      <FieldError id="category-form-error" message={formError} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : category ? "Save changes" : "Add category"}
        </Button>
      </div>
    </form>
  );
}

export function CategoryManager({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [pending, startTransition] = React.useTransition();

  const refresh = () => {
    setEditing(null);
    setCreating(false);
    router.refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;

    startTransition(async () => {
      const result = await deleteCategory(id);
      setDeleteTarget(null);
      if (!result.ok) {
        toast(result.error, { variant: "error" });
        return;
      }
      toast("Category deleted", { description: deleteTarget.name });
      router.refresh();
    });
  };

  const toggleActive = (category: Category, value: boolean) => {
    startTransition(async () => {
      const result = await setCategoryActive(category.id, value);
      if (!result.ok) {
        toast(result.error, { variant: "error" });
        return;
      }
      toast(value ? "Category is now visible" : "Category hidden from the storefront", {
        description: category.name,
        variant: value ? "success" : "info",
      });
      router.refresh();
    });
  };

  const dialogOpen = creating || Boolean(editing);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {categories.length} {categories.length === 1 ? "category" : "categories"}
        </p>
        <Button variant="dark" onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet."
          description="Create a category such as Men, Women or Kids to start organising products."
          action={
            <Button variant="dark" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Add category
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {categories.map((category) => {
            const productCount = counts[category.id] ?? 0;

            return (
              <li key={category.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-40 flex-1">
                  <p className="text-[15px] font-medium">{category.name}</p>
                  <p className="text-[13px] text-muted">
                    /category/{category.slug} · {productCount}{" "}
                    {productCount === 1 ? "product" : "products"}
                  </p>
                </div>

                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <Switch
                    checked={category.active}
                    onCheckedChange={(value) => toggleActive(category, value)}
                    aria-label={`Set ${category.name} active`}
                  />
                  Active
                </label>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(category)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-surface"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (productCount > 0) {
                        toast(
                          `Move the ${productCount} product${productCount === 1 ? "" : "s"} in “${category.name}” to another category first.`,
                          { variant: "warning" },
                        );
                        return;
                      }
                      setDeleteTarget(category);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface hover:text-red-600"
                  >
                    <Trash className="size-3.5" aria-hidden />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit category" : "Add category"}
        description="Categories power the navigation, the homepage grid and the shop filters."
      >
        <CategoryForm
          category={editing}
          onSaved={refresh}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Category"
        pendingLabel="Deleting…"
        onConfirm={handleDelete}
        pending={pending}
      />
    </div>
  );
}
