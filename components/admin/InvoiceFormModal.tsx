'use client';

import { useState, useEffect } from 'react';
import { supabase, type Invoice, type InvoiceItem } from '@/lib/supabase';
import { X, Plus, Trash2, Loader as Loader2, Save } from 'lucide-react';

type Props = {
  invoice?: Invoice;
  items?: InvoiceItem[];
  onClose: () => void;
  onSaved: () => void;
};

type DraftItem = {
  id?: string;
  description: string;
  hsn_sac_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  gst_percentage: number;
};

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoiceFormModal({ invoice, items, onClose, onSaved }: Props) {
  const isEdit = !!invoice;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState(invoice?.customer_name || '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customer_address || '');
  const [customerGst, setCustomerGst] = useState(invoice?.customer_gst || '');
  const [customerPan, setCustomerPan] = useState(invoice?.customer_pan || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(invoice?.place_of_supply || '');
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');
  const [notes, setNotes] = useState(invoice?.notes || '');

  const [draftItems, setDraftItems] = useState<DraftItem[]>(
    items && items.length > 0
      ? items.map(it => ({
          id: it.id,
          description: it.description,
          hsn_sac_code: it.hsn_sac_code || '',
          unit: it.unit || 'NOS',
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          gst_percentage: Number(it.gst_percentage),
        }))
      : [{ description: '', hsn_sac_code: '', unit: 'NOS', quantity: 1, unit_price: 0, gst_percentage: 18 }]
  );

  // Load orders for linking
  const [orders, setOrders] = useState<{ id: string; customer_name: string; product_name: string }[]>([]);
  const [linkedOrderId, setLinkedOrderId] = useState<string>(invoice?.order_id || '');

  useEffect(() => {
    supabase.from('orders').select('id, customer_name, product_name').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setOrders(data || []);
    });
  }, []);

  const handleLinkOrder = (orderId: string) => {
    setLinkedOrderId(orderId);
    if (!orderId) return;
    const order = orders.find(o => o.id === orderId);
    if (order && !customerName) setCustomerName(order.customer_name);
  };

  const addItem = () => setDraftItems(prev => [...prev, { description: '', hsn_sac_code: '', unit: 'NOS', quantity: 1, unit_price: 0, gst_percentage: 18 }]);
  const removeItem = (idx: number) => setDraftItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof DraftItem, value: string | number) => {
    setDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: field === 'description' || field === 'hsn_sac_code' || field === 'unit' ? value : Number(value) } : it));
  };

  // Calculations
  const calcItem = (it: DraftItem) => {
    const base = it.quantity * it.unit_price;
    const gst = (base * it.gst_percentage) / 100;
    return { base, gst, total: base + gst };
  };

  const subtotal = draftItems.reduce((s, it) => s + calcItem(it).base, 0);
  const gstTotal = draftItems.reduce((s, it) => s + calcItem(it).gst, 0);
  const grandTotal = subtotal + gstTotal;

  const handleSave = async () => {
    setError('');
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    if (!customerEmail.trim()) { setError('Customer email is required'); return; }
    const validItems = draftItems.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { setError('Add at least one line item with a description'); return; }

    setSaving(true);
    try {
      if (isEdit && invoice) {
        // Update invoice
        const { error: invErr } = await supabase.from('invoices').update({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          customer_gst: customerGst || null,
          customer_pan: customerPan || null,
          place_of_supply: placeOfSupply || null,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes: notes || null,
          order_id: linkedOrderId || null,
          subtotal,
          gst_total: gstTotal,
          grand_total: grandTotal,
        }).eq('id', invoice.id);

        if (invErr) throw invErr;

        // Delete old items, insert new
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
        const itemRows = validItems.map(it => {
          const c = calcItem(it);
          return {
            invoice_id: invoice.id,
            description: it.description,
            hsn_sac_code: it.hsn_sac_code || null,
            unit: it.unit || 'NOS',
            quantity: it.quantity,
            unit_price: it.unit_price,
            gst_percentage: it.gst_percentage,
            base_amount: c.base,
            gst_amount: c.gst,
            total: c.total,
          };
        });
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows);
        if (itemsErr) throw itemsErr;
      } else {
        // Generate invoice number
        const { data: seqData } = await supabase.rpc('next_invoice_number');
        const seq = seqData || 1;
        const year = new Date().getFullYear();
        const invoiceNumber = `INV-${year}-${String(seq).padStart(4, '0')}`;

        const { data: invData, error: invErr } = await supabase.from('invoices').insert({
          invoice_number: invoiceNumber,
          order_id: linkedOrderId || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          customer_gst: customerGst || null,
          customer_pan: customerPan || null,
          place_of_supply: placeOfSupply || null,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes: notes || null,
          subtotal,
          gst_total: gstTotal,
          grand_total: grandTotal,
          status: 'draft',
        }).select('id').single();

        if (invErr) throw invErr;

        const itemRows = validItems.map(it => {
          const c = calcItem(it);
          return {
            invoice_id: invData.id,
            description: it.description,
            hsn_sac_code: it.hsn_sac_code || null,
            unit: it.unit || 'NOS',
            quantity: it.quantity,
            unit_price: it.unit_price,
            gst_percentage: it.gst_percentage,
            base_amount: c.base,
            gst_amount: c.gst,
            total: c.total,
          };
        });
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows);
        if (itemsErr) throw itemsErr;
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">
          <h3 className="font-display text-xl font-bold text-green-900">
            {isEdit ? `Edit ${invoice!.invoice_number}` : 'Create Invoice'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-green-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Link to order */}
          {orders.length > 0 && (
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Link to Order (optional)</label>
              <select
                value={linkedOrderId}
                onChange={(e) => handleLinkOrder(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">No linked order</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.customer_name} - {o.product_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Customer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Email *</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Customer GSTIN</label>
              <input
                type="text"
                value={customerGst}
                onChange={(e) => setCustomerGst(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Customer PAN</label>
              <input
                type="text"
                value={customerPan}
                onChange={(e) => setCustomerPan(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                placeholder="ABCDE1234F"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Place of Supply</label>
              <input
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="27-Maharashtra"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Address</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="123 Business St, City, State - 400001"
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Line Items</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {draftItems.map((it, idx) => {
            const c = calcItem(it);
            return (
              <div key={idx} className="flex flex-col gap-2 bg-green-50/50 rounded-xl p-3 border border-green-100">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Product / Service description"
                    className="flex-1 w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  />
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={it.hsn_sac_code}
                    onChange={(e) => updateItem(idx, 'hsn_sac_code', e.target.value)}
                    placeholder="HSN/SAC"
                    className="w-24 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-center uppercase"
                  />
                  <select
                    value={it.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    <option value="NOS">NOS</option>
                    <option value="KG">KG</option>
                    <option value="GM">GM</option>
                    <option value="MTR">MTR</option>
                    <option value="PCS">PCS</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                    <option value="LTR">LTR</option>
                  </select>
                  <input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    min={1}
                    placeholder="Qty"
                    className="w-16 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-center"
                  />
                  <input
                    type="number"
                    value={it.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                    min={0}
                    placeholder="Price"
                    className="w-24 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-right"
                  />
                  <input
                    type="number"
                    value={it.gst_percentage}
                    onChange={(e) => updateItem(idx, 'gst_percentage', e.target.value)}
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder="GST%"
                    className="w-16 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-center"
                  />
                  <span className="text-xs text-green-700 font-medium flex-1 text-right self-center min-w-[80px]">&#8377;{fmt(c.total)}</span>
                </div>
              </div>
            );
          })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-green-700">
                <span>Subtotal</span>
                <span>&#8377;{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>GST Total</span>
                <span>&#8377;{fmt(gstTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-900 pt-2 border-t border-green-200 text-lg">
                <span>Grand Total</span>
                <span>&#8377;{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Payment terms, additional info..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
