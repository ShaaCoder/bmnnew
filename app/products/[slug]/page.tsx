import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 3600;

const SITE_URL = 'https://bharat-advance.netlify.app';
const SITE_NAME = 'Bharat Advance';

export async function generateStaticParams() {
  const { data: products } = await supabase.from('products').select('slug');
  return (products || []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price, gst_percentage, categories(name, slug)')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!product) return { title: 'Product Not Found' };

  const categoryName = (product.categories as any)?.name;
  const titleBase = `${product.name}${categoryName ? ` — ${categoryName}` : ''}`;
  const desc = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.name} at ${SITE_NAME}. Premium quality, GST-compliant billing, delivered across India.`;

  const priceWithGst = (product.price * (1 + (product.gst_percentage ?? 18) / 100)).toFixed(2);
  const canonicalUrl = `${SITE_URL}/products/${params.slug}`;
  const ogImage = product.images?.[0] ?? `${SITE_URL}/bmn_logo.jpeg`;

  return {
    title: titleBase,
    description: desc,
    keywords: [
      product.name,
      categoryName,
      'buy online India',
      'GST invoice',
      SITE_NAME,
      'Delhi',
      'premium quality',
    ].filter(Boolean) as string[],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      title: `${titleBase} | ${SITE_NAME}`,
      description: desc,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [{ url: ogImage, alt: product.name, width: 800, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titleBase} | ${SITE_NAME}`,
      description: desc,
      images: [ogImage],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!product) return notFound();

  const canonicalUrl = `${SITE_URL}/products/${params.slug}`;
  const categoryName = product.categories?.name;
  const priceWithGst = (product.price * (1 + (product.gst_percentage ?? 18) / 100)).toFixed(2);
  const primaryImage = product.images?.[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length > 0 ? product.images : undefined,
    url: canonicalUrl,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    ...(categoryName && {
      category: categoryName,
    }),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    ...(product.stock > 0 && {
      aggregateRating: undefined,
    }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      ...(categoryName
        ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${SITE_URL}/products?category=${product.categories?.slug}` },
           { '@type': 'ListItem', position: 4, name: product.name, item: canonicalUrl }]
        : [{ '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl }]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Navbar />
      <div className="pt-16">
        <ProductDetailClient product={product as any} />
      </div>
      <Footer />
    </>
  );
}
