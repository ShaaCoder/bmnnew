'use client';

import { type Order } from '@/lib/supabase';
import { X, Printer } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';

type Props = {
  order: Order;
  onClose: () => void;
};

export default function InvoiceModal({ order, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const gstRate = order.gst_percentage ?? 18;
  const baseAmount = order.product_price * order.quantity;
  const gstAmount = (baseAmount * gstRate) / 100;
  const total = baseAmount + gstAmount;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const invoiceNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    const content = invoiceRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    const logoUrl = window.location.origin + '/bmn_logo.jpeg';
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceNo}</title>
          <style>
            * { font-family: 'Inter', Arial, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
            body { padding: 40px; color: #14532d; }
            h1, h2, h3 { font-family: 'Georgia', serif; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
            .logo { display: flex; align-items: center; gap: 10px; }
            .logo-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
            .company-name { font-size: 20px; font-weight: bold; color: #14532d; }
            .company-tag { font-size: 11px; color: #16a34a; letter-spacing: 2px; text-transform: uppercase; }
            .invoice-info { text-align: right; }
            .invoice-title { font-size: 28px; font-weight: bold; color: #14532d; margin-bottom: 4px; }
            .invoice-meta { font-size: 12px; color: #666; }
            .bill-to { margin-bottom: 30px; }
            .bill-to h3 { font-size: 12px; text-transform: uppercase; color: #16a34a; margin-bottom: 8px; letter-spacing: 1px; }
            .bill-to p { font-size: 14px; color: #333; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f0fdf4; color: #14532d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px; text-align: left; border-bottom: 2px solid #16a34a; }
            td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e0f2fe; }
            .summary { margin-left: auto; width: 50%; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .summary-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #16a34a; margin-top: 8px; padding-top: 12px; color: #14532d; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0f2fe; text-align: center; font-size: 12px; color: #888; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">
          <h3 className="font-display text-xl font-bold text-green-900">Invoice</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-green-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-8" ref={invoiceRef}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-green-500">
            <div className="flex items-center gap-3">
              <Image src="/bmn_logo.jpeg" alt="Bharat Advance" width={40} height={40} className="rounded-full object-cover" />
              <div>
                <p className="font-display text-xl font-bold text-green-900">Bharat Advance</p>
                <p className="text-xs text-green-600 tracking-widest uppercase">Admin Panel</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-green-900">INVOICE</p>
              <p className="text-xs text-gray-500 mt-1">{invoiceNo}</p>
              <p className="text-xs text-gray-500">{date}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-green-600 uppercase tracking-wider mb-2">Bill To</h3>
            <p className="text-sm font-medium text-green-900">{order.customer_name}</p>
            <p className="text-sm text-gray-600">{order.customer_email}</p>
            <p className="text-sm text-gray-600">{order.customer_phone}</p>
            <p className="text-sm text-gray-600 mt-1">{order.customer_address}</p>
          </div>

          {/* Items table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-green-50 border-b-2 border-green-500">
                <th className="text-left py-3 px-4 text-xs font-medium text-green-700 uppercase tracking-wide">Product</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-green-700 uppercase tracking-wide">Qty</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-green-700 uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-green-700 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-green-50">
                <td className="py-3 px-4 text-sm text-green-800">{order.product_name}</td>
                <td className="py-3 px-4 text-sm text-green-800 text-right">{order.quantity}</td>
                <td className="py-3 px-4 text-sm text-green-800 text-right">&#8377;{fmt(order.product_price)}</td>
                <td className="py-3 px-4 text-sm text-green-800 text-right font-medium">&#8377;{fmt(baseAmount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-green-700">
                <span>Base Amount</span>
                <span>&#8377;{fmt(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>CGST ({gstRate / 2}%)</span>
                <span>&#8377;{fmt(cgst)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>SGST ({gstRate / 2}%)</span>
                <span>&#8377;{fmt(sgst)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-900 pt-3 border-t-2 border-green-500 text-lg">
                <span>Total</span>
                <span>&#8377;{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-green-50 text-center">
            <p className="text-xs text-gray-500">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-1">Bharat Advance &middot; 123 Business Avenue, Commercial District, City - 400001</p>
            <p className="text-xs text-gray-400">Phone: +91 98765 43210 &middot; Email: info@bharatadvance.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
