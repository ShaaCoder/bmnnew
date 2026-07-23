import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'All Products — Browse Our Collection',
  description: 'Browse the full range of premium products at Bharat Advance. Filter by category, find what you need, and order with GST-compliant billing.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'All Products — Bharat Advance',
    description: 'Shop our curated collection of premium products across all categories.',
    url: '/products',
  },
};

type Props = {
  searchParams: { category?: string; q?: string };
};

export default async function ProductsPage({ searchParams }: Props) {
  const [{ data: products }, { data: categories }] = await Promise.all([
    (() => {
      let q = supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false });
      if (searchParams.category) q = q.eq('categories.slug', searchParams.category);
      if (searchParams.q) q = q.ilike('name', `%${searchParams.q}%`);
      return q;
    })(),
    supabase.from('categories').select('*').order('name'),
  ]);

  const filtered = searchParams.category
    ? products?.filter((p: any) => p.categories?.slug === searchParams.category)
    : products;

  return (
    <>
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-green-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">
              <Link href="/" className="hover:text-green-300">Home</Link> / Products
            </p>
            <h1 className="font-display text-5xl font-bold">Our Products</h1>
            <p className="text-green-300/70 mt-3 max-w-lg">Browse our curated collection of premium products across all categories.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="md:w-56 shrink-0">
              <div className="bg-white rounded-2xl border border-green-100 p-5 sticky top-24">
                <h3 className="font-display font-semibold text-green-900 mb-4">Categories</h3>
                <div className="space-y-1">
                  <Link
                    href="/products"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!searchParams.category ? 'bg-green-800 text-white font-medium' : 'text-green-700 hover:bg-green-50'}`}
                  >
                    All Products
                  </Link>
                  {categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${searchParams.category === cat.slug ? 'bg-green-800 text-white font-medium' : 'text-green-700 hover:bg-green-50'}`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-green-600">
                  Showing <span className="font-medium text-green-900">{filtered?.length || 0}</span> products
                  {searchParams.category && (
                    <> in <span className="font-medium text-green-900">{categories?.find(c => c.slug === searchParams.category)?.name}</span></>
                  )}
                </p>
              </div>

              {filtered && filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-green-50 rounded-2xl">
                  <p className="text-green-400 text-lg">No products found.</p>
                  <Link href="/products" className="text-sm text-green-600 hover:underline mt-2 inline-block">View all products</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
