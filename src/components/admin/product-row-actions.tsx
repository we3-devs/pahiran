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
}: {
  productId: string;
  productName: string;
  active: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isActive, setIsActive] = React.useState(active);
  const [isFeatured, setIsFeatured] = React.useState(featured);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [busyFlag, setBusyFlag] = React.useState<"active" | "featured" | null>(null);

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
        toast(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      setConfirmOpen(false);

      if (!result.ok) {
        toast(result.error);
        return;
      }

      toast("Product deleted");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-[13px] text-muted">
        <Switch
          checked={isActive}
          disabled={pending && busyFlag === "active"}
          onCheckedChange={(value) => toggle("active", value)}
          aria-label={`Set ${productName} active`}
        />
        <span className={cn(busyFlag === "active" && "opacity-60")}>Active</span>
      </label>

      <label className="flex items-center gap-2 text-[13px] text-muted">
        <Switch
          checked={isFeatured}
          disabled={pending && busyFlag === "featured"}
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
          {pending && !confirmOpen ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash className="size-3.5" aria-hidden />
          )}
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete product?"
        description={`“${productName}” and its uploaded images will be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        pending={pending}
      />
    </div>
  );
}
