import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!product) return { title: 'Product Not Found' };

  const image = product.images?.[0];
  return {
    title: product.name,
    description: product.description
      ? product.description.slice(0, 160)
      : `Buy ${product.name} at Bharat Advance. Quality guaranteed with GST-compliant billing.`,
    alternates: { canonical: `/products/${params.slug}` },
    openGraph: {
      title: `${product.name} — Bharat Advance`,
      description: product.description?.slice(0, 160) || `Buy ${product.name} online`,
      url: `/products/${params.slug}`,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
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

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <ProductDetailClient product={product as any} />
      </div>
      <Footer />
    </>
  );
}
