"use client";

import { Minus, Plus } from "lucide-react";

import { MAX_QUANTITY } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
  label = "Quantity",
  className,
  compact = false,
  unavailable = false,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
  compact?: boolean;
  /** Out-of-stock lines keep their quantity visible but cannot be changed. */
  unavailable?: boolean;
}) {
  const buttonClass = cn(
    "inline-flex items-center justify-center text-ink transition-colors hover:bg-surface disabled:opacity-40",
    compact ? "size-8" : "size-11",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= min || unavailable}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={buttonClass}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>

      <span
        aria-live="polite"
        className={cn("text-center text-sm font-medium tabular-nums", compact ? "w-9" : "w-12")}
      >
        <span className="sr-only">{label}: </span>
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max || unavailable}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={buttonClass}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
