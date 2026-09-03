'use client';

import { useState } from 'react';
import { ShoppingCart, Star, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import OrderModal from './OrderModal';
import Link from 'next/link';

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const images = product.images?.filter(Boolean) ?? [];
  const hasMultiple = images.length > 1;

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };
  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="group bg-white rounded-2xl overflow-hidden border border-green-100 hover:border-green-300 hover:shadow-xl transition-all duration-300">
        <Link href={`/products/${product.slug}`} className="block relative overflow-hidden aspect-square bg-green-50">
          {images.length > 0 ? (
            <>
              <img
                src={images[imgIdx]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {hasMultiple && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 text-green-800" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 text-green-800" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-green-200" />
            </div>
          )}
          {product.featured && (
            <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          {hasMultiple && (
            <span className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              {imgIdx + 1} / {images.length}
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-green-800 text-sm font-medium px-4 py-2 rounded-full">Out of Stock</span>
            </div>
          )}
        </Link>

        <div className="p-4">
          {product.categories && (
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">{product.categories.name}</p>
          )}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-display font-semibold text-green-900 mb-1 hover:text-green-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-green-600/70 line-clamp-2 mb-3">{product.description}</p>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-green-900 text-lg">&#8377;{product.price.toLocaleString('en-IN')}</span>
              <span className="text-xs text-green-500">+{product.gst_percentage ?? 18}% GST</span>
              {product.stock > 0 && (
                <p className="text-xs text-green-600 mt-0.5">{product.stock} in stock</p>
              )}
            </div>
            <button
              disabled={product.stock === 0}
              onClick={() => setOrderOpen(true)}
              className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Buy
            </button>
          </div>
        </div>
      </div>

      {orderOpen && <OrderModal product={product} onClose={() => setOrderOpen(false)} />}
    </>
  );
}
