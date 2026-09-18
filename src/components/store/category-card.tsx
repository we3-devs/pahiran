import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn("group flex flex-col gap-3", className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted">
            {category.name}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg group-hover:text-brand">{category.name}</h3>
        {category.description ? (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {category.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
