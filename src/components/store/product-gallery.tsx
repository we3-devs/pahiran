"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = React.useState(0);
  const safeImages = images.filter(Boolean);

  if (safeImages.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-surface text-sm text-muted">
        No image available
      </div>
    );
  }

  const current = safeImages[Math.min(active, safeImages.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface">
        <Image
          key={current}
          src={current}
          alt={name}
          fill
          loading="eager"
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="animate-fade-in object-cover"
        />
      </div>

      {safeImages.length > 1 ? (
        <ul className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {safeImages.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${safeImages.length}`}
                aria-current={index === active}
                className={cn(
                  "relative h-[72px] w-16 shrink-0 overflow-hidden rounded-md border transition-colors",
                  index === active ? "border-ink" : "border-line hover:border-ink/40",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
