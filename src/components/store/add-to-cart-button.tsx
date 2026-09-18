"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/lib/cart/store";

export type AddableProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
};

export function AddToCartButton({
  product,
  quantity = 1,
  size = null,
  color = null,
  label = "Add to Cart",
  variant = "dark",
  buttonSize = "md",
  className,
  disabled,
  disabledReason,
}: {
  product: AddableProduct;
  quantity?: number;
  size?: string | null;
  color?: string | null;
  label?: string;
  variant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
  /** True for out-of-stock products — the button then reads "Out of Stock". */
  disabled?: boolean;
  disabledReason?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const [justAdded, setJustAdded] = React.useState(false);

  const handleClick = () => {
    // Guarded here as well as visually: an unavailable product can never be
    // added, no matter how the click arrived.
    if (disabled) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      size,
      color,
    });

    toast("Added to cart", {
      description: product.name,
      action: { label: "View Cart", href: "/cart" },
    });

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <Button
      variant={disabled ? "subtle" : variant}
      size={buttonSize}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledReason : undefined}
    >
      {disabled ? (
        "Out of Stock"
      ) : justAdded ? (
        <>
          <Check aria-hidden />
          Added
        </>
      ) : (
        label
      )}
    </Button>
  );
}
