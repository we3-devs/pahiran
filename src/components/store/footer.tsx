import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { SocialLinks } from "@/components/store/social-links";
import { Container } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const year = new Date().getFullYear();

  const whatsappNumber = normalizeWhatsappNumber(settings.whatsapp, settings.whatsapp_country_code);

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">{settings.store_name}</h2>
          {settings.footer_description || settings.description ? (
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {settings.footer_description ?? settings.description}
            </p>
          ) : null}

          <SocialLinks settings={settings} className="pt-1" />
        </div>

        <nav aria-label="Shop" className="space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-brand">
                All products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.slug}`} className="hover:text-brand">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-brand">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-brand">
                Cart
              </Link>
            </li>
          </ul>
        </nav>

        <address className="space-y-3 not-italic">
          <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">
            {settings.contact_title || "Contact"}
          </h3>
          {settings.contact_description ? (
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {settings.contact_description}
            </p>
          ) : null}
          <ul className="space-y-2.5 text-sm text-muted">
            {settings.address ? (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{settings.address}</span>
              </li>
            ) : null}
            {settings.phone ? (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-brand">
                  {settings.phone}
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`mailto:${settings.email}`} className="hover:text-brand">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {whatsappNumber ? (
              <li className="flex gap-2.5">
                <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  WhatsApp us
                </a>
              </li>
            ) : null}
          </ul>
        </address>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>{settings.copyright_text || `© ${year} ${settings.store_name}. All rights reserved.`}</p>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p>Orders are handled on WhatsApp.</p>
            <p>
              Powered by{" "}
              <span className="font-medium text-ink">Inovexa Labs</span>
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
