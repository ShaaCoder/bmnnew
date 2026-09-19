import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import HeroSlider from '@/components/HeroSlider';
import WebsiteVideoShowcase from '@/components/WebsiteVideoShowcase';
import Link from 'next/link';

import {
  ArrowRight,
  Shield,
  Truck,
  Headphones,
  Award,
  Sparkles,
  ShoppingBag,
  Play,
  CheckCircle2,
} from 'lucide-react';

import type { Metadata } from 'next';

export const revalidate = 0;

/* =========================================================
   METADATA
========================================================= */

export const metadata: Metadata = {
  title: 'Bharat Advance — Premium Quality Products Online',

  description:
    'Shop premium electronics, home decor, fashion, and more at Bharat Advance. GST-compliant invoicing, secure payments, and fast delivery across India.',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title:
      'Bharat Advance — Premium Quality Products Online',

    description:
      'Shop electronics, home decor, fashion and more. Trusted by 10,000+ customers across India.',

    url: '/',

    images: [
      {
        url: '/bmn_logo.jpeg',
        width: 800,
        height: 800,
        alt: 'Bharat Advance',
      },
    ],
  },
};

/* =========================================================
   HERO SLIDE TYPE
========================================================= */

export type HeroSlide = {
  id: string;

  image_url: string | null;

  badge: string | null;

  title: string | null;

  highlight: string | null;

  description: string | null;

  button_text: string | null;

  button_link: string | null;

  secondary_button_text: string | null;

  secondary_button_link: string | null;

  display_order: number;

  is_active: boolean;

  created_at?: string;

  updated_at?: string;
};

/* =========================================================
   WEBSITE VIDEO TYPE
========================================================= */

export type WebsiteVideo = {
  id: string;

  video_url: string;

  thumbnail_url: string | null;

  title: string;

  description: string | null;

  product_id: string | null;

  button_text: string;

  display_order: number;

  is_active: boolean;

  autoplay: boolean;

  muted: boolean;

  loop: boolean;

  created_at?: string;

  updated_at?: string;

  products?: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
};

/* =========================================================
   HOME PAGE
========================================================= */

export default async function HomePage() {
  /* =======================================================
     FETCH HOMEPAGE DATA
  ======================================================= */

  const [
    featuredResult,
    categoriesResult,
    galleryResult,
    heroResult,
    videosResult,
  ] = await Promise.all([
    /* =====================================================
       FEATURED PRODUCTS
    ===================================================== */

    supabase
      .from('products')
      .select('*, categories(*)')
      .eq('featured', true)
      .limit(6),

    /* =====================================================
       CATEGORIES
    ===================================================== */

    supabase
      .from('categories')
      .select('*')
      .limit(4),

    /* =====================================================
       GALLERY
    ===================================================== */

    supabase
      .from('gallery')
      .select('*')
      .order('display_order', {
        ascending: true,
      })
      .limit(3),

    /* =====================================================
       HERO SLIDES
    ===================================================== */

    supabase
      .from('website_hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', {
        ascending: true,
      }),

    /* =====================================================
       WEBSITE VIDEOS

       IMPORTANT:
       Do NOT request products.image.
    ===================================================== */

    supabase
      .from('website_videos')
      .select(`
        *,
        products (
          id,
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('display_order', {
        ascending: true,
      }),
  ]);

  /* =======================================================
     EXTRACT DATA
  ======================================================= */

  const featured = featuredResult.data;
  const categories = categoriesResult.data;
  const gallery = galleryResult.data;
  const heroSlides = heroResult.data;
  const websiteVideos = videosResult.data;

  /* =======================================================
     ERROR LOGGING
  ======================================================= */

  if (featuredResult.error) {
    console.error(
      'Homepage Featured Products Error:',
      featuredResult.error
    );
  }

  if (categoriesResult.error) {
    console.error(
      'Homepage Categories Error:',
      categoriesResult.error
    );
  }

  if (galleryResult.error) {
    console.error(
      'Homepage Gallery Error:',
      galleryResult.error
    );
  }

  if (heroResult.error) {
    console.error(
      'Homepage Hero Slides Error:',
      heroResult.error
    );
  }

  if (videosResult.error) {
    console.error(
      'Homepage Website Videos Error:',
      videosResult.error
    );
  }

  /* =======================================================
     HERO SLIDES
  ======================================================= */

  const slides: HeroSlide[] = (heroSlides || [])
    .filter(
      (slide: HeroSlide) =>
        typeof slide.image_url === 'string' &&
        slide.image_url.trim().length > 0
    )
    .map((slide: HeroSlide) => ({
      ...slide,

      image_url:
        slide.image_url?.trim() || null,

      badge:
        slide.badge?.trim() || null,

      title:
        slide.title?.trim() || null,

      highlight:
        slide.highlight?.trim() || null,

      description:
        slide.description?.trim() || null,

      button_text:
        slide.button_text?.trim() || null,

      button_link:
        slide.button_link?.trim() || null,

      secondary_button_text:
        slide.secondary_button_text?.trim() || null,

      secondary_button_link:
        slide.secondary_button_link?.trim() || null,
    }));

  /* =======================================================
     FALLBACK HERO
  ======================================================= */

  const fallbackHero: HeroSlide = {
    id: 'fallback',

    image_url:
      'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg',

    badge:
      'Premium Quality Products',

    title:
      'Discover the',

    highlight:
      'Bharat Collection',

    description:
      'Curated products across electronics, home decor, fashion, and more. Quality you can trust, delivered to your door.',

    button_text:
      'Shop Now',

    button_link:
      '/products',

    secondary_button_text:
      'View Gallery',

    secondary_button_link:
      '/gallery',

    display_order: 0,

    is_active: true,
  };

  const finalHeroSlides =
    slides.length > 0
      ? slides
      : [fallbackHero];

  /* =======================================================
     CLEAN WEBSITE VIDEOS
  ======================================================= */

  const finalWebsiteVideos: WebsiteVideo[] =
    (websiteVideos || [])
      .filter(
        (video: WebsiteVideo) =>
          typeof video.video_url === 'string' &&
          video.video_url.trim().length > 0 &&
          video.is_active === true
      )
      .map((video: WebsiteVideo) => ({
        ...video,

        video_url:
          video.video_url.trim(),

        thumbnail_url:
          video.thumbnail_url?.trim() || null,

        title:
          video.title?.trim() ||
          'Product Video',

        description:
          video.description?.trim() ||
          null,

        button_text:
          video.button_text?.trim() ||
          'Add To Cart',

        display_order:
          Number(video.display_order || 0),

        is_active:
          Boolean(video.is_active),

        autoplay:
          Boolean(video.autoplay),

        muted:
          Boolean(video.muted),

        loop:
          Boolean(video.loop),

        products:
          video.products
            ? {
                id: video.products.id,
                name: video.products.name,
                slug: video.products.slug,
              }
            : null,
      }))
      .sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-white">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <Navbar />

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative">
        <HeroSlider
          slides={finalHeroSlides}
        />
      </section>

      {/* ===================================================
          TRUST / BENEFITS
      =================================================== */}

      <section className="relative z-20 -mt-8 px-4">

        <div className="max-w-7xl mx-auto">

          <div className="bg-white rounded-3xl shadow-xl shadow-green-950/10 border border-green-100 p-5 md:p-7">

            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-green-100">

              {[
                {
                  icon: Truck,
                  title: 'Free Delivery',
                  desc: 'On orders above ₹999',
                },

                {
                  icon: Shield,
                  title: 'Secure Payment',
                  desc: '100% secure checkout',
                },

                {
                  icon: Headphones,
                  title: '24/7 Support',
                  desc: 'We are here to help',
                },

                {
                  icon: Award,
                  title: 'Premium Quality',
                  desc: 'Curated products',
                },
              ].map(
                ({
                  icon: Icon,
                  title,
                  desc,
                }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 px-4 md:px-6 py-3 first:pl-0 last:pr-0"
                  >

                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">

                      <Icon className="w-5 h-5 text-green-700" />

                    </div>

                    <div className="min-w-0">

                      <p className="text-green-950 font-semibold text-xs md:text-sm">
                        {title}
                      </p>

                      <p className="text-green-600 text-[10px] md:text-xs mt-1">
                        {desc}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          CATEGORIES
      =================================================== */}

      {categories &&
        categories.length > 0 && (
          <section className="py-24 bg-white">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* SECTION HEADER */}

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">

                <div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-4">

                    <Sparkles className="w-3.5 h-3.5" />

                    Explore Collection

                  </div>

                  <h2 className="font-display text-3xl md:text-5xl font-bold text-green-950 tracking-tight">

                    Shop by Category

                  </h2>

                  <p className="text-gray-500 mt-3 max-w-xl">

                    Discover products carefully selected for quality,
                    style and everyday value.

                  </p>

                </div>

                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors group"
                >
                  Explore all

                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                </Link>

              </div>

              {/* CATEGORY GRID */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

                {categories.map(
                  (cat, index) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="group relative overflow-hidden rounded-3xl aspect-[0.9] bg-green-100 shadow-sm hover:shadow-2xl hover:shadow-green-950/15 transition-all duration-500"
                    >

                      {/* IMAGE */}

                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200" />
                      )}

                      {/* OVERLAY */}

                      <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/20 to-transparent opacity-90" />

                      {/* NUMBER */}

                      <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs font-semibold">

                        {String(index + 1).padStart(2, '0')}

                      </div>

                      {/* CONTENT */}

                      <div className="absolute left-0 right-0 bottom-0 p-4 md:p-6">

                        <h3 className="font-display text-white font-bold text-base md:text-xl">

                          {cat.name}

                        </h3>

                        <div className="flex items-center gap-1.5 text-green-200 text-xs md:text-sm mt-2">

                          Explore

                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />

                        </div>

                      </div>

                    </Link>
                  )
                )}

              </div>

            </div>

          </section>
        )}

      {/* ===================================================
          FEATURED PRODUCTS
      =================================================== */}

      {featured &&
        featured.length > 0 && (
          <section className="py-24 bg-gradient-to-b from-green-50/70 to-white">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* HEADER */}

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">

                <div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">

                    <ShoppingBag className="w-3.5 h-3.5" />

                    Handpicked For You

                  </div>

                  <h2 className="font-display text-3xl md:text-5xl font-bold text-green-950 tracking-tight">

                    Featured Products

                  </h2>

                  <p className="text-gray-500 mt-3">

                    Quality products selected for your everyday needs.

                  </p>

                </div>

                <Link
                  href="/products"
                  className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 group"
                >

                  View all products

                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                </Link>

              </div>

              {/* PRODUCTS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">

                {featured.map(
                  (product) => (
                    <div
                      key={product.id}
                      className="group"
                    >

                      <ProductCard
                        product={
                          product as any
                        }
                      />

                    </div>
                  )
                )}

              </div>

              {/* MOBILE BUTTON */}

              <div className="text-center mt-10 md:hidden">

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-7 py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-green-900/15 transition-all"
                >

                  View all products

                  <ArrowRight className="w-4 h-4" />

                </Link>

              </div>

            </div>

          </section>
        )}

      {/* ===================================================
          VIDEO SHOWCASE
      =================================================== */}

      {finalWebsiteVideos.length > 0 && (
        <section className="relative py-24 bg-green-950 overflow-hidden">

          {/* BACKGROUND */}

          <div className="absolute inset-0 pointer-events-none">

            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl" />

            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl" />

          </div>

          <div className="relative z-10">

            {/* VIDEO HEADER */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

                <div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-green-300 text-xs font-semibold uppercase tracking-wider mb-4">

                    <Play className="w-3.5 h-3.5 fill-current" />

                    Product Stories

                  </div>

                  <h2 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight">

                    See It. Love It.{' '}

                    <span className="text-green-400">
                      Shop It.
                    </span>

                  </h2>

                  <p className="text-green-100/70 mt-3 max-w-xl">

                    Watch our products in action and discover
                    what makes them special.

                  </p>

                </div>

                <div className="hidden md:flex items-center gap-2 text-green-300 text-sm">

                  <CheckCircle2 className="w-4 h-4" />

                  Real product showcases

                </div>

              </div>

            </div>

            {/* EXISTING VIDEO COMPONENT */}

            <WebsiteVideoShowcase
              videos={finalWebsiteVideos}
            />

          </div>

        </section>
      )}

      {/* ===================================================
          GALLERY
      =================================================== */}

      {gallery &&
        gallery.length > 0 && (
          <section className="py-24 bg-white">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* HEADER */}

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">

                <div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-4">

                    <Award className="w-3.5 h-3.5" />

                    Our Showcase

                  </div>

                  <h2 className="font-display text-3xl md:text-5xl font-bold text-green-950">

                    Behind the Brand

                  </h2>

                  <p className="text-gray-500 mt-3 max-w-xl">

                    Explore moments, products and stories from
                    Bharat Advance.

                  </p>

                </div>

                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 group"
                >

                  View full gallery

                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                </Link>

              </div>

              {/* GALLERY GRID */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {gallery.map(
                  (item, i) => (
                    <div
                      key={item.id}
                      className={`relative overflow-hidden rounded-3xl group bg-green-100 ${
                        i === 0
                          ? 'md:row-span-2 md:min-h-[620px]'
                          : 'min-h-[300px]'
                      }`}
                    >

                      {/* IMAGE */}

                      <img
                        src={
                          item.image_url
                        }
                        alt={
                          item.title
                        }
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />

                      {/* GRADIENT */}

                      <div className="absolute inset-0 bg-gradient-to-t from-green-950/90 via-green-950/10 to-transparent" />

                      {/* TOP BADGE */}

                      <div className="absolute top-5 left-5">

                        <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">

                          Bharat Advance

                        </span>

                      </div>

                      {/* CONTENT */}

                      <div className="absolute left-0 right-0 bottom-0 p-5 md:p-6">

                        <h3 className="text-white font-display font-bold text-lg md:text-xl">

                          {item.title}

                        </h3>

                        {item.description && (
                          <p className="text-green-100/75 text-sm mt-2 line-clamp-2">

                            {item.description}

                          </p>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          </section>
        )}

      {/* ===================================================
          PREMIUM CTA
      =================================================== */}

      <section className="px-4 py-20 bg-white">

        <div className="max-w-7xl mx-auto">

          <div className="relative overflow-hidden rounded-[2rem] bg-green-950 px-6 py-16 md:px-16 md:py-20">

            {/* DECORATIVE ELEMENTS */}

            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-green-500/20 blur-3xl" />

            <div className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-10 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg")',
              }}
            />

            {/* CONTENT */}

            <div className="relative z-10 max-w-3xl mx-auto text-center">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-green-300 text-xs font-semibold uppercase tracking-wider mb-6">

                <Headphones className="w-4 h-4" />

                Need Assistance?

              </div>

              <h2 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight">

                We're Here to Help You

              </h2>

              <p className="text-green-100/70 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">

                Have a question about a product, order or anything
                else? Our team is ready to help you.

              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9">

                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-green-950 font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-black/20 group"
                >

                  Get In Touch

                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                </Link>

                <Link
                  href="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl backdrop-blur-sm transition-all"
                >

                  <ShoppingBag className="w-4 h-4" />

                  Browse Products

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <Footer />

    </main>
  );
}