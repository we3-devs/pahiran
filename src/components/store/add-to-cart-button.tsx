"use client";

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
  disabled?: boolean;
  disabledReason?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const [justAdded, setJustAdded] = React.useState(false);

  const handleClick = () => {
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

    toast("Added to cart");
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <Button
      variant={variant}
      size={buttonSize}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
    >
      {justAdded ? "✓ Added" : label}
    </Button>
  );
}
