import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

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
