'use client';

import { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, Package, Tag } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import OrderModal from '@/components/OrderModal';
import Link from 'next/link';

export default function ProductDetailClient({ product }: { product: Product & { categories?: any } }) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);

  const images = product.images?.length > 0 ? product.images : [];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-green-600 mb-8">
          <Link href="/" className="hover:text-green-800">Home</Link>
          {' / '}
          <Link href="/products" className="hover:text-green-800">Products</Link>
          {' / '}
          <span className="text-green-900">{product.name}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-green-50 aspect-square mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-green-200" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImg((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-md transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-green-800" />
                  </button>
                  <button
                    onClick={() => setSelectedImg((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-md transition"
                  >
                    <ChevronRight className="w-5 h-5 text-green-800" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === i ? 'border-green-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {product.categories && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full w-fit mb-4">
                <Tag className="w-3 h-3" /> {product.categories.name}
              </span>
            )}
            <h1 className="font-display text-4xl font-bold text-green-900 mb-4">{product.name}</h1>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-green-900">&#8377;{product.price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-green-500">+ {product.gst_percentage ?? 18}% GST</span>
            </div>
            <p className="text-xs text-green-500 mb-6">
              Total: &#8377;{((product.price * (1 + (product.gst_percentage ?? 18) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} (incl. GST)
            </p>

            {product.description && (
              <p className="text-green-700/70 leading-relaxed mb-8">{product.description}</p>
            )}

            <div className="bg-green-50 rounded-2xl p-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Availability</span>
                {product.stock > 0 ? (
                  <span className="text-sm font-medium text-green-700 bg-white px-3 py-1 rounded-full border border-green-200">
                    {product.stock} in stock
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">Out of Stock</span>
                )}
              </div>
            </div>

            <button
              disabled={product.stock === 0}
              onClick={() => setOrderOpen(true)}
              className="flex items-center justify-center gap-2 bg-green-800 hover:bg-green-600 text-white py-4 rounded-2xl font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>

            <p className="text-xs text-green-500 text-center mt-4">
              Your order details will be sent to our team for processing.
            </p>
          </div>
        </div>
      </div>

      {orderOpen && <OrderModal product={product as any} onClose={() => setOrderOpen(false)} />}
    </>
  );
}
