"use client";

import { LoaderCircle, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { deleteProduct, setProductFlag } from "@/lib/actions/products";
import { cn } from "@/lib/utils";

export function ProductRowActions({
  productId,
  productName,
  active,
  featured,
  inStock,
}: {
  productId: string;
  productName: string;
  active: boolean;
  featured: boolean;
  inStock: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isActive, setIsActive] = React.useState(active);
  const [isFeatured, setIsFeatured] = React.useState(featured);
  const [isInStock, setIsInStock] = React.useState(inStock);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [deleting, setDeleting] = React.useState(false);
  const [busyFlag, setBusyFlag] = React.useState<"active" | "featured" | "in_stock" | null>(null);

  const toggle = (field: "active" | "featured", value: boolean) => {
    const previous = field === "active" ? isActive : isFeatured;
    const setLocal = field === "active" ? setIsActive : setIsFeatured;
    setLocal(value);
    setBusyFlag(field);

    startTransition(async () => {
      const result = await setProductFlag(productId, field, value);
      setBusyFlag(null);

      if (!result.ok) {
        setLocal(previous);
        toast(result.error, { variant: "error" });
        return;
      }

      toast(
        field === "active"
          ? value
            ? "Product is now visible"
            : "Product hidden from the storefront"
          : value
            ? "Added to the featured collection"
            : "Removed from the featured collection",
        { description: productName, variant: value ? "success" : "info" },
      );
      router.refresh();
    });
  };

  const changeAvailability = (value: boolean) => {
    setIsInStock(value);
    setBusyFlag("in_stock");

    startTransition(async () => {
      const result = await setProductFlag(productId, "in_stock", value);
      setBusyFlag(null);

      if (!result.ok) {
        setIsInStock(!value);
        toast(result.error, { variant: "error" });
        return;
      }

      toast(value ? "Marked as in stock" : "Marked as out of stock", {
        description: productName,
        variant: value ? "success" : "warning",
      });
      router.refresh();
    });
  };

  const handleDelete = () => {
    setDeleting(true);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      setDeleting(false);
      setConfirmOpen(false);

      if (!result.ok) {
        toast(result.error, { variant: "error" });
        return;
      }

      toast("Product deleted", { description: productName });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-2 text-[13px] text-muted">
        <span
          aria-hidden
          className={cn("size-2 rounded-full", isInStock ? "bg-emerald-500" : "bg-red-500")}
        />
        <span className="sr-only">Availability</span>
        <select
          value={isInStock ? "in_stock" : "out_of_stock"}
          onChange={(event) => changeAvailability(event.target.value === "in_stock")}
          disabled={busyFlag === "in_stock"}
          aria-label={`Availability for ${productName}`}
          className="h-9 rounded-md border border-line bg-canvas px-2 text-[13px] font-medium text-ink disabled:opacity-50"
        >
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        {busyFlag === "in_stock" ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : null}
      </label>

      <label className="flex items-center gap-2 text-[13px] text-muted">
        <Switch
          checked={isActive}
          disabled={busyFlag === "active"}
          onCheckedChange={(value) => toggle("active", value)}
          aria-label={`Set ${productName} active`}
        />
        <span className={cn(busyFlag === "active" && "opacity-60")}>Active</span>
      </label>

      <label className="flex items-center gap-2 text-[13px] text-muted">
        <Switch
          checked={isFeatured}
          disabled={busyFlag === "featured"}
          onCheckedChange={(value) => toggle("featured", value)}
          aria-label={`Set ${productName} featured`}
        />
        <span className={cn(busyFlag === "featured" && "opacity-60")}>Featured</span>
      </label>

      <div className="flex items-center gap-1">
        <Link
          href={`/admin/products/${productId}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-surface"
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface hover:text-red-600"
        >
          <Trash className="size-3.5" aria-hidden />
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete product?"
        description={`“${productName}” and its uploaded images will be removed. This action cannot be undone.`}
        confirmLabel="Delete Product"
        pendingLabel="Deleting…"
        onConfirm={handleDelete}
        pending={pending && deleting}
      />
    </div>
  );
}
