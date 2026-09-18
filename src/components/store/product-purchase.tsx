"use client";

import * as React from "react";

import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/lib/cart/store";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Errors = { size?: string; color?: string };

export function ProductPurchase({ product }: { product: Product }) {
  const [size, setSize] = React.useState<string | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [errors, setErrors] = React.useState<Errors>({});
  const [added, setAdded] = React.useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];

  const handleAdd = () => {
    const nextErrors: Errors = {};
    if (sizes.length > 0 && !size) nextErrors.size = "Please choose a size.";
    if (colors.length > 0 && !color) nextErrors.color = "Please choose a colour.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity,
      size,
      color,
    });

    toast("Added to cart");
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-6">
      {sizes.length > 0 ? (
        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">
            Size
            {size ? <span className="ml-2 font-normal text-muted">{size}</span> : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSize(option);
                  setErrors((current) => ({ ...current, size: undefined }));
                }}
                aria-pressed={size === option}
                className={cn(
                  "min-w-11 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors",
                  size === option
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink hover:border-ink/50",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.size ? (
            <p role="alert" className="mt-2 text-[13px] font-medium text-red-600">
              {errors.size}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {colors.length > 0 ? (
        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">
            Colour
            {color ? <span className="ml-2 font-normal text-muted">{color}</span> : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setColor(option);
                  setErrors((current) => ({ ...current, color: undefined }));
                }}
                aria-pressed={color === option}
                className={cn(
                  "rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors",
                  color === option
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink hover:border-ink/50",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.color ? (
            <p role="alert" className="mt-2 text-[13px] font-medium text-red-600">
              {errors.color}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="flex items-center gap-4">
        <span id="quantity-label" className="text-sm font-medium">
          Quantity
        </span>
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="dark" size="lg" onClick={handleAdd} className="w-full sm:w-auto sm:min-w-48">
          {added ? "✓ Added to cart" : "Add to Cart"}
        </Button>
        <p className="text-[13px] text-muted">Secure ordering on WhatsApp — no online payment.</p>
      </div>
    </div>
  );
}
