'use client';

import { useState } from 'react';
import { X, ShoppingCart, Loader as Loader2, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';

type Props = {
  product: Product;
  onClose: () => void;
};

export default function OrderModal({ product, onClose }: Props) {
  const [step, setStep] = useState<'info' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    quantity: 1,
    notes: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === 'quantity' ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (
      !form.customer_name.trim() ||
      !form.customer_email.trim() ||
      !form.customer_phone.trim() ||
      !form.customer_address.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        product_id: product.id,
        product_name: product.name,
        product_price: Number(product.price),
        gst_percentage: Number(product.gst_percentage ?? 18),
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
        quantity: Math.max(1, Number(form.quantity)),
        notes: form.notes.trim() || null,
        status: 'pending',
      };

      const { error: dbError } = await supabase.from('orders').insert(orderData);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while placing the order.');
    } finally {
      setLoading(false);
    }
  };

  const gstRate = product.gst_percentage ?? 18;
  const baseAmount = product.price * form.quantity;
  const gstAmount = (baseAmount * gstRate) / 100;
  const totalWithGst = baseAmount + gstAmount;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {step === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-display text-2xl font-bold text-green-900 mb-2">Order Placed!</h3>
            <p className="text-green-700/70 text-sm mb-2">
              Thank you, <span className="font-medium text-green-800">{form.customer_name}</span>.
            </p>
            <p className="text-green-700/70 text-sm mb-6">
              Your order for <span className="font-medium text-green-800">{product.name}</span> has been received. Our team will contact you shortly.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-green-800 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="font-display text-xl font-bold text-green-900">Place Order</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-green-50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-green-600" />
              </button>
            </div>

            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900 text-sm">{product.name}</p>
                  <p className="text-green-600 text-xs mt-0.5">&#8377;{product.price.toLocaleString('en-IN')} per unit</p>
                </div>
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                )}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="px-6 py-3 bg-white border-b border-green-50">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-green-700">
                  <span>Base Price ({form.quantity} &#215; &#8377;{product.price.toLocaleString('en-IN')})</span>
                  <span>&#8377;{fmt(baseAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600 text-xs">
                  <span>CGST ({gstRate / 2}%)</span>
                  <span>&#8377;{fmt(cgst)}</span>
                </div>
                <div className="flex justify-between text-green-600 text-xs">
                  <span>SGST ({gstRate / 2}%)</span>
                  <span>&#8377;{fmt(sgst)}</span>
                </div>
                <div className="flex justify-between font-bold text-green-900 pt-1.5 border-t border-green-100">
                  <span>Total (incl. GST @ {gstRate}%)</span>
                  <span>&#8377;{fmt(totalWithGst)}</span>
                </div>
              </div>
            </div>

            <form id="orderForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Full Name *</label>
                  <input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Email *</label>
                  <input
                    name="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Phone *</label>
                  <input
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Delivery Address *</label>
                  <textarea
                    name="customer_address"
                    value={form.customer_address}
                    onChange={handleChange}
                    placeholder="Full delivery address"
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    max={product.stock}
                    value={form.quantity}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <div className="w-full bg-green-50 rounded-xl px-3.5 py-2.5 border border-green-200">
                    <p className="text-xs text-green-600">Total (incl. GST)</p>
                    <p className="font-bold text-green-900">&#8377;{fmt(totalWithGst)}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50/50 transition resize-none"
                  />
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-green-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl font-medium text-sm hover:bg-green-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="orderForm"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {loading ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
