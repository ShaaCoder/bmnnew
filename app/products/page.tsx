import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';

/*
 * Always fetch fresh product data.
 * Offline products are filtered directly from Supabase.
 */
export const revalidate = 0;

const SITE_URL = 'https://www.bmnenterprises.in/';
const SITE_NAME = 'Bharat Advance';

type SearchParams = {
  category?: string;
  q?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;

  let title = 'All Products — Browse Our Collection';

  let description =
    'Browse the full range of premium products at Bharat Advance. Filter by category, find what you need, and order with GST-compliant billing.';

  let canonical = '/products';

  /* -------------------------------------------------------
     CATEGORY SEO
  ------------------------------------------------------- */

  if (params.category) {
    const { data: cat, error } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('slug', params.category)
      .maybeSingle();

    if (error) {
      console.error(
        'Category metadata error:',
        error
      );
    }

    if (cat) {
      title = `${cat.name} Products — Bharat Advance`;

      description =
        `Shop our curated selection of ${cat.name} products at Bharat Advance. Premium quality with GST-compliant invoicing.`;

      canonical =
        `/products?category=${encodeURIComponent(
          cat.slug
        )}`;
    }
  }

  /* -------------------------------------------------------
     SEARCH SEO
  ------------------------------------------------------- */

  if (params.q) {
    const searchQuery = params.q.trim();

    if (searchQuery) {
      title =
        `Search results for "${searchQuery}" — Bharat Advance`;

      description =
        `Find "${searchQuery}" at Bharat Advance. Premium products with GST billing delivered across India.`;

      canonical =
        `/products?q=${encodeURIComponent(
          searchQuery
        )}`;
    }
  }

  return {
    title,
    description,

    keywords: [
      'Bharat Advance products',
      'buy online India',
      'GST invoice',
      'premium products Delhi',
      'online shopping India',
      'quality products',
    ],

    alternates: {
      canonical: `${SITE_URL}${canonical}`,
    },

    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonical}`,
      siteName: SITE_NAME,
      locale: 'en_IN',

      images: [
        {
          url: `${SITE_URL}/bmn_logo.jpeg`,
          width: 800,
          height: 800,
          alt: SITE_NAME,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        `${SITE_URL}/bmn_logo.jpeg`,
      ],
    },
  };
}

/* =========================================================
   PRODUCTS PAGE
========================================================= */

export default async function ProductsPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const categorySlug =
    params.category?.trim() || '';

  const searchQuery =
    params.q?.trim() || '';

  /* =======================================================
     PRODUCTS QUERY
     
     IMPORTANT:
     - We DO NOT use status because your products table
       does not contain a status column.
     - is_offline = false means the product is available
       on the public online store.
     - is_offline = true means physical/offline inventory
       only.
  ======================================================= */

  let productsQuery = supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug,
        description,
        image_url
      )
    `)
    .eq('is_offline', false)
    .order('created_at', {
      ascending: false,
    });

  /* -------------------------------------------------------
     CATEGORY FILTER
  ------------------------------------------------------- */

  if (categorySlug) {
    productsQuery = productsQuery.eq(
      'categories.slug',
      categorySlug
    );
  }

  /* -------------------------------------------------------
     SEARCH FILTER
  ------------------------------------------------------- */

  if (searchQuery) {
    productsQuery = productsQuery.ilike(
      'name',
      `%${searchQuery}%`
    );
  }

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const [
    productsResult,
    categoriesResult,
  ] = await Promise.all([
    productsQuery,

    supabase
      .from('categories')
      .select('*')
      .order('name', {
        ascending: true,
      }),
  ]);

  /* =======================================================
     ERROR LOGGING
  ======================================================= */

  if (productsResult.error) {
    console.error(
      'PRODUCTS SUPABASE ERROR:',
      productsResult.error
    );
  }

  if (categoriesResult.error) {
    console.error(
      'CATEGORIES SUPABASE ERROR:',
      categoriesResult.error
    );
  }

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const products =
    productsResult.data ?? [];

  const categories =
    categoriesResult.data ?? [];

  /* =======================================================
     FINAL OFFLINE SAFETY FILTER
     
     This is an additional frontend/server-side safeguard.
     Even if the database query changes later, offline
     products will not accidentally appear publicly.
  ======================================================= */

  const onlineProducts =
    products.filter(
      (product: any) =>
        product.is_offline !== true
    );

  /* =======================================================
     FINAL CATEGORY FILTER
  ======================================================= */

  const filtered = categorySlug
    ? onlineProducts.filter(
        (product: any) =>
          product.categories?.slug ===
          categorySlug
      )
    : onlineProducts;

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const currentCategory =
    categorySlug
      ? categories.find(
          (category) =>
            category.slug ===
            categorySlug
        )
      : null;

  /* =======================================================
     PRODUCT JSON-LD
  ======================================================= */

  const itemListLd = {
    '@context':
      'https://schema.org',

    '@type': 'ItemList',

    name: currentCategory
      ? `${currentCategory.name} Products`
      : 'Products — Bharat Advance',

    url: `${SITE_URL}/products`,

    numberOfItems:
      filtered.length,

    itemListElement: filtered
      .slice(0, 50)
      .map(
        (
          product: any,
          index: number
        ) => ({
          '@type': 'ListItem',

          position: index + 1,

          url: `${SITE_URL}/products/${product.slug}`,

          name: product.name,

          ...(product.images?.[0]
            ? {
                image:
                  product.images[0],
              }
            : {}),
        })
      ),
  };

  /* =======================================================
     BREADCRUMB JSON-LD
  ======================================================= */

  const breadcrumbLd = {
    '@context':
      'https://schema.org',

    '@type':
      'BreadcrumbList',

    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },

      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${SITE_URL}/products`,
      },
    ],
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      {/* =================================================
          STRUCTURED DATA
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              itemListLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbLd
            ),
        }}
      />

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar />

      <div className="pt-16">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bg-green-950 text-white py-16">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">

              <Link
                href="/"
                className="hover:text-green-300"
              >
                Home
              </Link>

              {' / Products'}

            </p>

            <h1 className="font-display text-5xl font-bold">
              {currentCategory
                ? currentCategory.name
                : 'Our Products'}
            </h1>

            <p className="text-green-300/70 mt-3 max-w-lg">
              {currentCategory
                ? `Browse our ${currentCategory.name} products.`
                : 'Browse our curated collection of premium products across all categories.'}
            </p>

          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="flex flex-col md:flex-row gap-8">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="md:w-56 shrink-0">

              <div className="bg-white rounded-2xl border border-green-100 p-5 sticky top-24">

                <h3 className="font-display font-semibold text-green-900 mb-4">
                  Categories
                </h3>

                <div className="space-y-1">

                  {/* ALL PRODUCTS */}

                  <Link
                    href="/products"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !categorySlug
                        ? 'bg-green-800 text-white font-medium'
                        : 'text-green-700 hover:bg-green-50'
                    }`}
                  >
                    All Products
                  </Link>

                  {/* CATEGORIES */}

                  {categories.map(
                    (cat) => (

                      <Link
                        key={cat.id}
                        href={`/products?category=${encodeURIComponent(
                          cat.slug
                        )}`}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          categorySlug ===
                          cat.slug
                            ? 'bg-green-800 text-white font-medium'
                            : 'text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {cat.name}
                      </Link>

                    )
                  )}

                </div>

              </div>

            </aside>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <div className="flex-1">

              {/* RESULT COUNT */}

              <div className="flex items-center justify-between mb-6">

                <p className="text-sm text-green-600">

                  Showing{' '}

                  <span className="font-medium text-green-900">
                    {filtered.length}
                  </span>{' '}

                  {filtered.length === 1
                    ? 'product'
                    : 'products'}

                  {currentCategory && (
                    <>
                      {' '}in{' '}

                      <span className="font-medium text-green-900">
                        {currentCategory.name}
                      </span>
                    </>
                  )}

                </p>

              </div>

              {/* =================================================
                  PRODUCT GRID
              ================================================= */}

              {filtered.length > 0 ? (

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                  {filtered.map(
                    (product: any) => (

                      <ProductCard
                        key={product.id}
                        product={product}
                      />

                    )
                  )}

                </div>

              ) : (

                /* =================================================
                   EMPTY STATE
                ================================================= */

                <div className="text-center py-20 bg-green-50 rounded-2xl">

                  <p className="text-green-400 text-lg">
                    No products found.
                  </p>

                  <Link
                    href="/products"
                    className="text-sm text-green-600 hover:underline mt-2 inline-block"
                  >
                    View all products
                  </Link>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />
    </>
  );
}