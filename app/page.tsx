import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { ArrowRight, Shield, Truck, Headphones, Award } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Bharat Advance — Premium Quality Products Online',
  description: 'Shop premium electronics, home decor, fashion, and more at Bharat Advance. GST-compliant invoicing, secure payments, and fast delivery across India.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Bharat Advance — Premium Quality Products Online',
    description: 'Shop electronics, home decor, fashion and more. Trusted by 10,000+ customers across India.',
    url: '/',
    images: [{ url: '/bmn_logo.jpeg', width: 800, height: 800, alt: 'Bharat Advance' }],
  },
};

export default async function HomePage() {
  const [{ data: featured }, { data: categories }, { data: gallery }] = await Promise.all([
    supabase.from('products').select('*, categories(*)').eq('featured', true).limit(6),
    supabase.from('categories').select('*').limit(4),
    supabase.from('gallery').select('*').order('display_order').limit(3),
  ]);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-green-950">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg')" }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 text-green-300 text-xs font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <Award className="w-3.5 h-3.5" />
            Premium Quality Products
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Discover the
            <span className="block text-green-400">Bharat Collection</span>
          </h1>
          <p className="text-green-100/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Curated products across electronics, home decor, fashion, and more. Quality you can trust, delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 hover:gap-3 text-sm shadow-lg shadow-green-900/30"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-8 py-4 rounded-xl transition-all duration-200 backdrop-blur-sm text-sm"
            >
              View Gallery
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-green-50 border-y border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Payment', desc: '100% safe transactions' },
              { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer care' },
              { icon: Award, title: 'Premium Quality', desc: 'Curated products only' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm">{title}</p>
                  <p className="text-xs text-green-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">Browse By</p>
              <h2 className="font-display text-4xl font-bold text-green-900">Product Categories</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-green-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-green-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-white font-semibold text-lg">{cat.name}</h3>
                    <p className="text-green-200 text-xs mt-0.5 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Explore <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured && featured.length > 0 && (
        <section className="py-20 bg-green-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">Handpicked For You</p>
                <h2 className="font-display text-4xl font-bold text-green-900">Featured Products</h2>
              </div>
              <Link href="/products" className="hidden md:flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
            <div className="text-center mt-10 md:hidden">
              <Link href="/products" className="inline-flex items-center gap-2 border border-green-200 text-green-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
                View all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Preview */}
      {gallery && gallery.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">Our Showcase</p>
                <h2 className="font-display text-4xl font-bold text-green-900">Gallery</h2>
              </div>
              <Link href="/gallery" className="hidden md:flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gallery.map((item, i) => (
                <div key={item.id} className={`relative overflow-hidden rounded-2xl group ${i === 0 ? 'md:row-span-2' : ''}`}>
                  <div className={`${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'} overflow-hidden`}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-display font-semibold">{item.title}</h4>
                      {item.description && <p className="text-green-200 text-xs mt-1">{item.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 bg-green-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg')", backgroundSize: 'cover' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Have a Question?</h2>
          <p className="text-green-200/80 mb-8">Our team is here to help you find the perfect product or answer any queries you may have.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-900/30"
          >
            Get In Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
