import Link from "next/link";

import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  action?: { label: string; href: string } | null;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2", align === "center" && "mx-auto text-center")}>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
        {description ? (
          <p className="text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-brand"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
