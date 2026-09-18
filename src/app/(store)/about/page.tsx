import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "About",
    description:
      settings.about_description ??
      settings.description ??
      `Learn more about ${settings.store_name}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const settings = await getStoreSettings();

  const heading = settings.about_heading ?? `About ${settings.store_name}`;
  const intro = settings.about_description ?? settings.description;
  const body = settings.about_body;

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <div
        className={cn(
          "mt-8 grid gap-10",
          settings.about_image && "lg:grid-cols-2 lg:items-center lg:gap-16",
        )}
      >
        <div className="max-w-2xl space-y-5">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{heading}</h1>
          {intro ? <p className="text-lg leading-relaxed text-ink/80">{intro}</p> : null}
          {body ? (
            <div className="space-y-4 text-[15px] leading-relaxed text-muted">
              {body.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/shop" className={buttonVariants({ variant: "dark", size: "lg" })}>
              Shop the collection
            </Link>
            <Link href="/contact" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Contact us
            </Link>
          </div>
        </div>

        {settings.about_image ? (
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
            <Image
              src={settings.about_image}
              alt={heading}
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      {settings.address || settings.business_hours ? (
        <div className="mt-16 grid gap-6 rounded-xl border border-line bg-surface p-6 sm:grid-cols-2">
          {settings.address ? (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">
                Studio
              </h2>
              <p className="text-[15px]">{settings.address}</p>
            </div>
          ) : null}
          {settings.business_hours ? (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">
                Opening hours
              </h2>
              <p className="text-[15px]">{settings.business_hours}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Container>
  );
}
