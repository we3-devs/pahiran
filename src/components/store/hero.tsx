import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Every string and the image come from `store_settings` — nothing is hardcoded. */
export function Hero({ settings }: { settings: StoreSettings }) {
  if (!settings.hero_enabled) return null;

  const showImage = settings.hero_show_image && Boolean(settings.hero_image);
  const title = settings.hero_title?.trim();
  const hasSecondary =
    settings.hero_show_secondary_button &&
    Boolean(settings.hero_secondary_button_text) &&
    Boolean(settings.hero_secondary_button_link);

  if (!title && !settings.hero_description && !showImage) return null;

  return (
    <section className="border-b border-line bg-surface">
      <Container
        className={cn(
          "grid items-center gap-10 py-14 lg:gap-16 lg:py-20",
          showImage && "lg:grid-cols-[1.05fr_0.95fr]",
        )}
      >
        <div className="max-w-xl space-y-6">
          {settings.hero_show_label && settings.hero_label ? (
            <p className="text-xs font-semibold tracking-[0.24em] uppercase text-brand">
              {settings.hero_label}
            </p>
          ) : null}

          {title ? (
            <h1 className="font-display text-[2.1rem] leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {title}
            </h1>
          ) : null}

          {settings.hero_description ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted sm:text-base">
              {settings.hero_description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {settings.hero_primary_button_text && settings.hero_primary_button_link ? (
              <Link
                href={settings.hero_primary_button_link}
                className={buttonVariants({ size: "lg", variant: "primary" })}
              >
                {settings.hero_primary_button_text}
              </Link>
            ) : null}

            {hasSecondary ? (
              <Link
                href={settings.hero_secondary_button_link as string}
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {settings.hero_secondary_button_text}
              </Link>
            ) : null}
          </div>
        </div>

        {showImage ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface sm:aspect-[16/11] lg:aspect-[4/5]">
            <Image
              src={settings.hero_image as string}
              alt={title ?? settings.store_name}
              fill
              // Above the fold, so load it eagerly. `loading="eager"` rather
              // than `preload`: for a `vw`-sized image the preloaded variant can
              // differ from the one the browser picks, which wastes a download.
              loading="eager"
              data-probe="v2"
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
