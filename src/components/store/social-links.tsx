import { ArrowUpRight } from "lucide-react";

import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Only the links the owner has filled in are rendered. */
export function socialEntries(settings: StoreSettings) {
  return [
    { label: "Facebook", href: settings.facebook },
    { label: "Instagram", href: settings.instagram },
    { label: "TikTok", href: settings.tiktok },
    { label: "YouTube", href: settings.youtube },
  ].filter((entry): entry is { label: string; href: string } => Boolean(entry.href));
}

export function SocialLinks({
  settings,
  variant = "pill",
  className,
}: {
  settings: StoreSettings;
  variant?: "pill" | "text";
  className?: string;
}) {
  const entries = socialEntries(settings);
  if (entries.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {entries.map((entry) => (
        <li key={entry.label}>
          <a
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 text-[13px] transition-colors",
              variant === "pill"
                ? "rounded-full border border-line bg-canvas px-3.5 py-2 hover:border-brand hover:text-brand"
                : "text-muted hover:text-brand",
            )}
          >
            {entry.label}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
