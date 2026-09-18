import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { SocialLinks, socialEntries } from "@/components/store/social-links";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";
import { cn } from "@/lib/utils";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "Contact",
    description:
      settings.contact_description ??
      `Contact ${settings.store_name} — address, phone, email and WhatsApp.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const whatsapp = normalizeWhatsappNumber(settings.whatsapp, settings.whatsapp_country_code);

  const socials = socialEntries(settings);

  const details = [
    settings.address
      ? { label: "Address", value: settings.address, Icon: MapPin }
      : null,
    settings.phone
      ? {
          label: "Phone",
          value: settings.phone,
          href: `tel:${settings.phone.replace(/\s/g, "")}`,
          Icon: Phone,
        }
      : null,
    settings.email
      ? { label: "Email", value: settings.email, href: `mailto:${settings.email}`, Icon: Mail }
      : null,
    settings.business_hours
      ? { label: "Business hours", value: settings.business_hours, Icon: Clock }
      : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; Icon: typeof MapPin }[];

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <header className="mt-8 max-w-2xl space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl">{settings.contact_title}</h1>
        {settings.contact_description ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">
            {settings.contact_description}
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <dl className="grid gap-6 sm:grid-cols-2">
          {details.map(({ label, value, href, Icon }) => (
            <div key={label} className="rounded-xl border border-line p-5">
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-muted">
                <Icon className="size-4" aria-hidden />
                {label}
              </dt>
              <dd className="mt-2 text-[15px]">
                {href ? (
                  <a href={href} className="hover:text-brand">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}

          {details.length === 0 ? (
            <p className="text-sm text-muted">
              Contact details have not been added yet. Please check back soon.
            </p>
          ) : null}
        </dl>

        <aside className="rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg">Order or ask a question</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            WhatsApp is the fastest way to reach us. Size questions, fabric details and delivery
            times — just send a message.
          </p>

          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-5 w-full")}
            >
              <MessageCircle aria-hidden />
              Chat on WhatsApp
            </a>
          ) : null}

          {socials.length > 0 ? (
            <>
              <h2 className="mt-6 text-xs font-semibold tracking-[0.16em] uppercase text-muted">
                Follow us
              </h2>
              <SocialLinks settings={settings} className="mt-3" />
            </>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
