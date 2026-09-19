import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Youtube,
  Facebook,
  Globe,
  Star,
  MessageCircle,
  Linkedin,
  Send,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

/* =========================================================
   WEBSITE SETTINGS TYPE
========================================================= */

type WebsiteSettings = {
  footer_map_url: string | null;
  footer_map_title: string | null;
  footer_map_enabled: boolean;
};

/* =========================================================
   FOOTER
========================================================= */

export default async function Footer() {
  // ==========================================
  // FETCH COMPANY SETTINGS
  // ==========================================

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  // ==========================================
  // FETCH WEBSITE SETTINGS
  // ==========================================

  const { data: websiteSettings } = await supabase
    .from('website_settings')
    .select(
      `
        footer_map_url,
        footer_map_title,
        footer_map_enabled
      `
    )
    .limit(1)
    .maybeSingle();

  const website =
    websiteSettings as WebsiteSettings | null;

  // ==========================================
  // COMPANY INFORMATION
  // ==========================================

  const companyName =
    settings?.company_name ||
    'B M N Enterprises';

  const address =
    settings?.address ||
    'Bharat Advance House, I-107 Vijay Vihar Phase II, Vijay Vihar, Sector 4, Rohini, New Delhi, 110085';

  const logoUrl =
    settings?.logo_url ||
    '/bmn_logo.jpeg';

  // ==========================================
  // MULTIPLE PHONE NUMBERS
  // ==========================================

  const phoneNumbers: string[] =
    Array.isArray(settings?.phone_numbers)
      ? settings.phone_numbers.filter(
          (phone: string) =>
            phone?.trim()
        )
      : [];

  // ==========================================
  // MULTIPLE EMAILS
  // ==========================================

  const emails: string[] =
    Array.isArray(settings?.emails)
      ? settings.emails.filter(
          (email: string) =>
            email?.trim()
        )
      : [];

  // ==========================================
  // FOOTER MAP
  // ==========================================

  const mapUrl =
    website?.footer_map_url?.trim() || '';

  const mapTitle =
    website?.footer_map_title?.trim() ||
    'Find Us';

  const showMap =
    website?.footer_map_enabled === true &&
    Boolean(mapUrl);

  // ==========================================
  // FETCH SOCIAL LINKS
  // ==========================================

  let socialLinks: any[] = [];

  if (settings?.id) {
    const {
      data: socialData,
    } = await supabase
      .from('social_links')
      .select('*')
      .eq(
        'company_id',
        settings.id
      )
      .eq(
        'is_active',
        true
      )
      .order(
        'display_order',
        {
          ascending: true,
        }
      );

    socialLinks = (
      socialData || []
    ).filter(
      (social) =>
        social.url?.trim()
    );
  }

  // ==========================================
  // SOCIAL ICON FUNCTION
  // ==========================================

  const getSocialIcon = (
    platform: string
  ) => {
    const value =
      platform.toLowerCase();

    if (
      value.includes(
        'instagram'
      )
    ) {
      return (
        <Instagram className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'youtube'
      )
    ) {
      return (
        <Youtube className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'facebook'
      )
    ) {
      return (
        <Facebook className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'linkedin'
      )
    ) {
      return (
        <Linkedin className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'whatsapp'
      )
    ) {
      return (
        <MessageCircle className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'telegram'
      ) ||
      value.includes(
        'send'
      )
    ) {
      return (
        <Send className="w-5 h-5" />
      );
    }

    if (
      value.includes(
        'google'
      ) ||
      value.includes(
        'business'
      )
    ) {
      return (
        <Star className="w-5 h-5" />
      );
    }

    return (
      <Globe className="w-5 h-5" />
    );
  };

  // ==========================================
  // SOCIAL HOVER COLORS
  // ==========================================

  const getSocialHoverClass = (
    platform: string
  ) => {
    const value =
      platform.toLowerCase();

    if (
      value.includes(
        'youtube'
      )
    ) {
      return 'hover:bg-red-600';
    }

    if (
      value.includes(
        'instagram'
      )
    ) {
      return 'hover:bg-pink-600';
    }

    if (
      value.includes(
        'facebook'
      )
    ) {
      return 'hover:bg-blue-600';
    }

    if (
      value.includes(
        'linkedin'
      )
    ) {
      return 'hover:bg-blue-700';
    }

    if (
      value.includes(
        'whatsapp'
      )
    ) {
      return 'hover:bg-green-600';
    }

    if (
      value.includes(
        'google'
      )
    ) {
      return 'hover:bg-yellow-500';
    }

    if (
      value.includes(
        'telegram'
      )
    ) {
      return 'hover:bg-sky-500';
    }

    return 'hover:bg-green-600';
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <footer className="bg-green-950 text-green-100">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* =================================================
            MAIN FOOTER GRID
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* ===============================================
              COMPANY
          =============================================== */}

          <div className="md:col-span-2">

            <Link
              href="/"
              className="flex items-center gap-3 mb-4"
            >

              <Image
                src={logoUrl}
                alt={companyName}
                width={44}
                height={44}
                className="rounded-full object-cover"
                unoptimized
              />

              <span className="font-display font-bold text-white text-xl">
                {companyName}
              </span>

            </Link>

            <p className="text-green-300 text-sm leading-relaxed max-w-xs">
              Your trusted partner for quality products.
              We bring the best of every category right to
              your doorstep.
            </p>

            {/* ===========================================
                SOCIAL MEDIA
            =========================================== */}

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">

                {socialLinks.map(
                  (social) => (
                    <a
                      key={social.id}
                      href={
                        social.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-full bg-green-900 ${getSocialHoverClass(
                        social.platform
                      )} flex items-center justify-center transition`}
                      title={
                        social.label ||
                        social.platform
                      }
                      aria-label={
                        social.label ||
                        social.platform
                      }
                    >
                      {getSocialIcon(
                        social.platform
                      )}
                    </a>
                  )
                )}

              </div>
            )}

          </div>

          {/* ===============================================
              QUICK LINKS
          =============================================== */}

          <div>

            <h4 className="font-display text-white font-semibold mb-4">
              Quick Links
            </h4>

            <ul className="space-y-2">

              {[
                {
                  href: '/',
                  label: 'Home',
                },
                {
                  href: '/products',
                  label: 'Products',
                },
                {
                  href: '/gallery',
                  label: 'Gallery',
                },
                {
                  href: '/about',
                  label: 'About Us',
                },
                {
                  href: '/contact',
                  label: 'Contact Us',
                },
              ].map(
                (link) => (
                  <li
                    key={
                      link.href
                    }
                  >
                    <Link
                      href={
                        link.href
                      }
                      className="text-sm text-green-300 hover:text-green-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}

            </ul>

          </div>

          {/* ===============================================
              CONTACT
          =============================================== */}

          <div>

            <h4 className="font-display text-white font-semibold mb-4">
              Contact
            </h4>

            <ul className="space-y-4">

              {/* ADDRESS */}

              <li className="flex items-start gap-2 text-sm text-green-300">

                <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />

                <span>
                  {address}
                </span>

              </li>

              {/* ========================================
                  ALL PHONE NUMBERS
              ======================================== */}

              {phoneNumbers.length > 0 && (
                <li>

                  <div className="flex items-start gap-2">

                    <Phone className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />

                    <div className="flex flex-col gap-1">

                      {phoneNumbers.map(
                        (
                          phone,
                          index
                        ) => (
                          <a
                            key={`${phone}-${index}`}
                            href={`tel:${phone.replace(
                              /[^0-9+]/g,
                              ''
                            )}`}
                            className="text-sm text-green-300 hover:text-green-400 transition-colors"
                          >
                            {phone}
                          </a>
                        )
                      )}

                    </div>

                  </div>

                </li>
              )}

              {/* ========================================
                  ALL EMAILS
              ======================================== */}

              {emails.length > 0 && (
                <li>

                  <div className="flex items-start gap-2">

                    <Mail className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />

                    <div className="flex flex-col gap-1">

                      {emails.map(
                        (
                          email,
                          index
                        ) => (
                          <a
                            key={`${email}-${index}`}
                            href={`mailto:${email}`}
                            className="text-sm text-green-300 hover:text-green-400 transition-colors break-all"
                          >
                            {email}
                          </a>
                        )
                      )}

                    </div>

                  </div>

                </li>
              )}

            </ul>

          </div>

        </div>

        {/* =================================================
            LOCATION MAP
        ================================================= */}

        {showMap && (
          <section className="mt-14">

            {/* MAP HEADER */}

            <div className="flex items-center gap-3 mb-5">

              <div className="w-10 h-10 rounded-xl bg-green-900 flex items-center justify-center shrink-0">

                <MapPin className="w-5 h-5 text-green-400" />

              </div>

              <div>

                <h3 className="font-display text-white font-semibold text-lg">
                  {mapTitle}
                </h3>

                <p className="text-green-400 text-xs mt-0.5">
                  Visit our location
                </p>

              </div>

            </div>

            {/* MAP */}

            <div className="rounded-2xl overflow-hidden border border-green-800 bg-green-900 shadow-lg">

              <iframe
                src={mapUrl}
                title={mapTitle}
                width="100%"
                height="400"
                style={{
                  border: 0,
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-[300px] sm:h-[380px] md:h-[400px]"
              />

            </div>

          </section>
        )}

        {/* =================================================
            BOTTOM FOOTER
        ================================================= */}

        <div className="border-t border-green-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-xs text-green-400">

            &copy;{' '}
            {new Date().getFullYear()}{' '}
            {companyName}.
            All rights reserved.

          </p>

          <div className="flex items-center gap-4">

            <Link
              href="/privacy-policy"
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Privacy Policy
            </Link>

            <span className="text-green-700 text-xs">
              &middot;
            </span>

            <Link
              href="/admin"
              className="text-xs text-green-500 hover:text-green-300 transition-colors"
            >
              Admin Panel
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}