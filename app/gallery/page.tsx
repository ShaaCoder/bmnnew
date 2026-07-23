import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const revalidate = 0;

export default async function GalleryPage() {
  const { data: items } = await supabase.from('gallery').select('*').order('display_order');

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <div className="bg-green-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-green-400 text-xs font-medium uppercase tracking-widest mb-2">
              <Link href="/" className="hover:text-green-300">Home</Link> / Gallery
            </p>
            <h1 className="font-display text-5xl font-bold">Our Gallery</h1>
            <p className="text-green-300/70 mt-3 max-w-lg">A visual showcase of our products, showroom, and collections.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {items && items.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="break-inside-avoid group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-display font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="text-green-200 text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-green-50 rounded-2xl">
              <p className="text-green-400 text-lg">Gallery is empty.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
