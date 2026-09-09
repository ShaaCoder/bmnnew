'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, type Invoice, type InvoiceItem, type HsnCode, type Supplier } from '@/lib/supabase';
import { X, Plus, Trash2, Loader as Loader2, Save, ChevronDown, ShieldCheck, CheckCircle2, Search } from 'lucide-react';

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
  discount_value: number;
  discount_type: 'amount' | 'percentage';
  item_note: string;
};

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoiceFormModal({ invoice, items, onClose, onSaved }: Props) {
  const isEdit = !!invoice;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Invoice type / prefix
  const [invoiceType, setInvoiceType] = useState(invoice?.invoice_type || 'Regular');
  const [invoicePrefix, setInvoicePrefix] = useState(invoice?.invoice_prefix || 'INV');

  // Document references
  const [challanNo, setChallanNo] = useState(invoice?.challan_no || '');
  const [challanDate, setChallanDate] = useState(invoice?.challan_date || '');
  const [poNo, setPoNo] = useState(invoice?.po_no || '');
  const [poDate, setPoDate] = useState(invoice?.po_date || '');
  const [lrNo, setLrNo] = useState(invoice?.lr_no || '');
  const [ewayNo, setEwayNo] = useState(invoice?.eway_no || '');

  // Customer details
  const [customerName, setCustomerName] = useState(invoice?.customer_name || '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customer_address || '');
  const [contactPerson, setContactPerson] = useState(invoice?.contact_person || '');
  const [customerGst, setCustomerGst] = useState(invoice?.customer_gst || '');
  const [gstVerification, setGstVerification] = useState<{ status: 'verified' | 'error'; message: string } | null>(null);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [customerPan, setCustomerPan] = useState(invoice?.customer_pan || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(invoice?.place_of_supply || '');
  const [reverseCharge, setReverseCharge] = useState(invoice?.reverse_charge || 'No');
  const [deliveryMode, setDeliveryMode] = useState(invoice?.delivery_mode || '');
  const [shipTo, setShipTo] = useState(invoice?.ship_to || '');

  // Dates
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');

  // Payment / bank / terms
  const [paymentType, setPaymentType] = useState(invoice?.payment_type || 'Credit');
  const [bankDetails, setBankDetails] = useState(invoice?.bank_details || '');
  const [termsTitle, setTermsTitle] = useState(invoice?.terms_title || '');
  const [termsDetail, setTermsDetail] = useState(invoice?.terms_detail || '');

  // Discount / TCS / rounding
  const [discountValue, setDiscountValue] = useState(Number(invoice?.discount_value) || 0);
  const [discountType, setDiscountType] = useState(invoice?.discount_type || 'amount');
  const [tcsValue, setTcsValue] = useState(Number(invoice?.tcs_value) || 0);
  const [tcsType, setTcsType] = useState(invoice?.tcs_type || 'percentage');
  const [roundOff, setRoundOff] = useState(Number(invoice?.round_off) || 0);

  // Notes
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [documentNotes, setDocumentNotes] = useState(invoice?.document_notes || '');

  // Supplier picker
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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
          discount_value: Number(it.discount_value) || 0,
          discount_type: (it.discount_type as 'amount' | 'percentage') || 'amount',
          item_note: it.item_note || '',
        }))
      : [{ description: '', hsn_sac_code: '', unit: 'NOS', quantity: 1, unit_price: 0, gst_percentage: 18, discount_value: 0, discount_type: 'amount', item_note: '' }]
  );

  const [orders, setOrders] = useState<{ id: string; customer_name: string; product_name: string }[]>([]);
  const [linkedOrderId, setLinkedOrderId] = useState<string>(invoice?.order_id || '');
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);

  useEffect(() => {
    supabase.from('orders').select('id, customer_name, product_name').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setOrders(data || []);
    });
    supabase.from('hsn_codes').select('*').order('code').then(({ data }) => {
      setHsnCodes(data || []);
    });
    supabase.from('suppliers').select('*').order('name').then(({ data }) => {
      setSuppliers((data as Supplier[]) || []);
    });
  }, []);

  const filteredSuppliers = suppliers.filter(s => {
    const q = supplierSearch.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.gstin || '').toLowerCase().includes(q) || (s.contact_person || '').toLowerCase().includes(q);
  });

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
    setCustomerName(supplier.name);
    setCustomerEmail(supplier.email || '');
    setCustomerPhone(supplier.phone || '');
    setContactPerson(supplier.contact_person || '');
    setCustomerGst(supplier.gstin || '');
    setCustomerPan(supplier.pan || '');
    const fullAddress = [supplier.address, supplier.address_line_2, supplier.landmark, supplier.city, supplier.state, supplier.country, supplier.pincode].filter(Boolean).join(', ');
    setCustomerAddress(fullAddress);
    setPlaceOfSupply(supplier.state || '');
    setGstVerification(null);
  };

  const handleLinkOrder = (orderId: string) => {
    setLinkedOrderId(orderId);
    if (!orderId) return;
    const order = orders.find(o => o.id === orderId);
    if (order && !customerName) setCustomerName(order.customer_name);
  };

  const verifyCustomerGstin = async () => {
    const gstin = customerGst.toUpperCase().trim();
    setCustomerGst(gstin);
    setGstVerification(null);

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      setGstVerification({ status: 'error', message: 'Enter a valid 15-character GSTIN.' });
      return;
    }

    setVerifyingGst(true);
    const { data, error: invokeError } = await supabase.functions.invoke('verify-gstin', {
      body: { gstin, include_profile: true },
    });
    setVerifyingGst(false);

    if (invokeError || !data?.success) {
      setGstVerification({ status: 'error', message: data?.error || invokeError?.message || 'GSTIN verification failed.' });
      return;
    }

    const profile = data.data;
    const tradeName = profile?.trade_name || profile?.business_name || profile?.tradeName || '';
    const legalName = profile?.legal_name || '';
    setGstVerification({ status: 'verified', message: `${tradeName || legalName || 'GSTIN'} verified successfully.` });
    if (tradeName && !customerName.trim()) setCustomerName(tradeName);
    if (legalName && !contactPerson.trim()) setContactPerson(legalName);
    if (profile?.address && !customerAddress.trim()) setCustomerAddress(profile.address);
    if (profile?.state_code && !placeOfSupply.trim()) setPlaceOfSupply(`${profile.state_code} - ${profile.address_details?.state || profile.city || 'Registered State'}`);
  };

  const addItem = () => setDraftItems(prev => [...prev, { description: '', hsn_sac_code: '', unit: 'NOS', quantity: 1, unit_price: 0, gst_percentage: 18, discount_value: 0, discount_type: 'amount', item_note: '' }]);
  const removeItem = (idx: number) => setDraftItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof DraftItem, value: string | number) => {
    setDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: field === 'description' || field === 'hsn_sac_code' || field === 'unit' || field === 'item_note' || field === 'discount_type' ? value : Number(value) } : it));
  };

  const saveHsnCodeIfNew = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const exists = hsnCodes.some(h => h.code.toUpperCase() === trimmed);
    if (exists) return;
    const { data, error } = await supabase
      .from('hsn_codes')
      .insert({ code: trimmed })
      .select('*')
      .single();
    if (!error && data) {
      setHsnCodes(prev => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
    }
  };

  // Calculations
  const calcItem = (it: DraftItem) => {
    const gross = it.quantity * it.unit_price;
    const itemDiscount = it.discount_type === 'percentage' ? (gross * it.discount_value) / 100 : it.discount_value;
    const base = Math.max(0, gross - itemDiscount);
    const gst = (base * it.gst_percentage) / 100;
    return { base, gst, total: base + gst };
  };

  const subtotal = draftItems.reduce((s, it) => s + calcItem(it).base, 0);
  const gstTotal = draftItems.reduce((s, it) => s + calcItem(it).gst, 0);

  const invoiceDiscount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAfterDiscount = Math.max(0, subtotal - invoiceDiscount);
  const tcsAmount = tcsType === 'percentage' ? (taxableAfterDiscount * tcsValue) / 100 : tcsValue;
  const grandTotalRaw = taxableAfterDiscount + gstTotal + tcsAmount + roundOff;
  const grandTotal = Math.round(grandTotalRaw * 100) / 100;

  const buildInvoicePayload = () => ({
    invoice_type: invoiceType,
    invoice_prefix: invoicePrefix || 'INV',
    challan_no: challanNo || null,
    challan_date: challanDate || null,
    po_no: poNo || null,
    po_date: poDate || null,
    lr_no: lrNo || null,
    eway_no: ewayNo || null,
    delivery_mode: deliveryMode || null,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone || null,
    customer_address: customerAddress || null,
    contact_person: contactPerson || null,
    customer_gst: customerGst || null,
    customer_pan: customerPan || null,
    place_of_supply: placeOfSupply || null,
    reverse_charge: reverseCharge,
    ship_to: shipTo || null,
    invoice_date: invoiceDate,
    due_date: dueDate || null,
    payment_type: paymentType,
    bank_details: bankDetails || null,
    terms_title: termsTitle || null,
    terms_detail: termsDetail || null,
    document_notes: documentNotes || null,
    notes: notes || null,
    tcs_value: tcsValue,
    tcs_type: tcsType,
    discount_value: discountValue,
    discount_type: discountType,
    round_off: roundOff,
    subtotal,
    gst_total: gstTotal,
    grand_total: grandTotal,
    order_id: linkedOrderId || null,
    supplier_id: selectedSupplier?.id || null,
  });

  const handleSave = async () => {
    setError('');
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    if (!customerEmail.trim()) { setError('Customer email is required'); return; }
    const validItems = draftItems.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { setError('Add at least one line item with a description'); return; }

    setSaving(true);
    try {
      await Promise.all(validItems.map(it => saveHsnCodeIfNew(it.hsn_sac_code)));

      if (isEdit && invoice) {
        const { error: invErr } = await supabase.from('invoices').update(buildInvoicePayload()).eq('id', invoice.id);
        if (invErr) throw invErr;

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
            discount_value: it.discount_value,
            discount_type: it.discount_type,
            item_note: it.item_note || null,
            base_amount: c.base,
            gst_amount: c.gst,
            total: c.total,
          };
        });
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows);
        if (itemsErr) throw itemsErr;
      } else {
        const { data: seqData } = await supabase.rpc('next_invoice_number');
        const seq = seqData || 1;
        const year = new Date().getFullYear();
        const invoiceNumber = `${invoicePrefix || 'INV'}-${year}-${String(seq).padStart(4, '0')}`;

        const { data: invData, error: invErr } = await supabase.from('invoices').insert({
          ...buildInvoicePayload(),
          invoice_number: invoiceNumber,
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
            discount_value: it.discount_value,
            discount_type: it.discount_type,
            item_note: it.item_note || null,
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

  const inputCls = "w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400";
  const labelCls = "text-xs font-medium text-green-600 uppercase tracking-wide";
  const cardCls = "bg-green-50/40 rounded-2xl p-4 border border-green-100 space-y-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col">
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
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Section: Invoice Details */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">Invoice Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Invoice Type</label>
                <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className={inputCls}>
                  <option value="Regular">Regular</option>
                  <option value="Reverse Charge">Reverse Charge</option>
                  <option value="Export">Export</option>
                  <option value="Debit Note">Debit Note</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Prefix</label>
                <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())} className={inputCls} placeholder="INV" maxLength={6} />
              </div>
              <div>
                <label className={labelCls}>Invoice Date</label>
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Challan No.</label>
                <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className={inputCls} placeholder="DC-001" />
              </div>
              <div>
                <label className={labelCls}>Challan Date</label>
                <input type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Delivery Mode</label>
                <input type="text" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)} className={inputCls} placeholder="By Road / Transport" />
              </div>
              <div>
                <label className={labelCls}>PO No.</label>
                <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} className={inputCls} placeholder="PO-001" />
              </div>
              <div>
                <label className={labelCls}>PO Date</label>
                <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>LR / Transport No.</label>
                <input type="text" value={lrNo} onChange={(e) => setLrNo(e.target.value)} className={inputCls} placeholder="LR-001" />
              </div>
              <div>
                <label className={labelCls}>E-Way Bill No.</label>
                <input type="text" value={ewayNo} onChange={(e) => setEwayNo(e.target.value)} className={inputCls} placeholder="EW-001" />
              </div>
              <div>
                <label className={labelCls}>Reverse Charge</label>
                <select value={reverseCharge} onChange={(e) => setReverseCharge(e.target.value)} className={inputCls}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Type</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputCls}>
                  <option value="Credit">Credit</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: M/S. Supplier picker */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">M/S. (Supplier / Customer)</h4>
            <div className="relative">
              <Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => { setSupplierSearch(e.target.value); setShowSupplierDropdown(true); setSelectedSupplier(null); }}
                onFocus={() => setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
                placeholder="Search saved supplier / customer by name or GSTIN..."
                autoComplete="off"
              />
              {selectedSupplier && <CheckCircle2 className="w-4 h-4 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />}
            </div>
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="relative">
                <div className="absolute z-10 mt-1 w-full bg-white border border-green-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                  {filteredSuppliers.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSupplier(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 border-b border-green-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-green-900">{s.name}</p>
                      <p className="text-xs text-green-500">{s.gstin || 'No GSTIN'}{s.city ? ` · ${s.city}` : ''}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showSupplierDropdown && filteredSuppliers.length === 0 && supplierSearch && (
              <p className="text-xs text-green-500 mt-2">No matching supplier found. You can enter details manually below.</p>
            )}
          </div>

          {/* Section: Customer / Bill To */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">Bill To (Customer Details)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} placeholder="Company / Person name" />
              </div>
              <div>
                <label className={labelCls}>Contact Person</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} placeholder="Contact person name" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} placeholder="john@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className={labelCls}>Customer GSTIN</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    value={customerGst}
                    onChange={(e) => { setCustomerGst(e.target.value.toUpperCase()); setGstVerification(null); }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                  />
                  <button
                    type="button"
                    onClick={verifyCustomerGstin}
                    disabled={verifyingGst || !customerGst.trim()}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-green-700 border border-green-200 rounded-xl hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {verifyingGst ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {verifyingGst ? 'Checking' : 'Verify'}
                  </button>
                </div>
                {gstVerification && (
                  <div className={`flex items-start gap-1.5 mt-2 text-xs ${gstVerification.status === 'verified' ? 'text-green-700' : 'text-red-600'}`}>
                    {gstVerification.status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                    <span>{gstVerification.message}</span>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Customer PAN</label>
                <input type="text" value={customerPan} onChange={(e) => setCustomerPan(e.target.value.toUpperCase())} className={inputCls + ' uppercase'} placeholder="ABCDE1234F" />
              </div>
              <div>
                <label className={labelCls}>Place of Supply</label>
                <input type="text" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} className={inputCls} placeholder="27-Maharashtra" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Billing Address</label>
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="123 Business St, City, State - 400001" />
            </div>
            <div>
              <label className={labelCls}>Ship To (Delivery Address)</label>
              <textarea value={shipTo} onChange={(e) => setShipTo(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Delivery address if different from billing" />
            </div>
          </div>

          {/* Section: Line Items */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-green-800">Products / Line Items</h4>
              <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {draftItems.map((it, idx) => {
                const c = calcItem(it);
                return (
                  <div key={idx} className="flex flex-col gap-2 bg-white rounded-xl p-3 border border-green-100">
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
                    <div className="flex flex-wrap gap-2 items-center">
                      <HsnCodeInput
                        key={`hsn-${idx}`}
                        value={it.hsn_sac_code}
                        codes={hsnCodes}
                        onChange={(val) => updateItem(idx, 'hsn_sac_code', val)}
                        onBlur={(val) => saveHsnCodeIfNew(val)}
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
                        value={it.discount_value}
                        onChange={(e) => updateItem(idx, 'discount_value', e.target.value)}
                        min={0}
                        placeholder="Disc"
                        className="w-20 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-center"
                      />
                      <select
                        value={it.discount_type}
                        onChange={(e) => updateItem(idx, 'discount_type', e.target.value)}
                        className="px-1.5 py-2 text-xs border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                      >
                        <option value="amount">₹</option>
                        <option value="percentage">%</option>
                      </select>
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
                      <span className="text-xs text-green-700 font-medium flex-1 text-right self-center min-w-[80px]">₹{fmt(c.total)}</span>
                    </div>
                    <input
                      type="text"
                      value={it.item_note}
                      onChange={(e) => updateItem(idx, 'item_note', e.target.value)}
                      placeholder="Item note (optional)"
                      className="w-full px-3 py-1.5 text-xs border border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-green-50/30"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Discount / TCS / Rounding / Totals */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">Discount, TCS & Totals</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Invoice Discount</label>
                <div className="flex gap-2 mt-1.5">
                  <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} min={0} className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="px-2 py-2.5 text-xs border border-green-200 rounded-xl bg-white">
                    <option value="amount">₹</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>TCS</label>
                <div className="flex gap-2 mt-1.5">
                  <input type="number" value={tcsValue} onChange={(e) => setTcsValue(Number(e.target.value))} min={0} className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <select value={tcsType} onChange={(e) => setTcsType(e.target.value)} className="px-2 py-2.5 text-xs border border-green-200 rounded-xl bg-white">
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Round Off (₹)</label>
                <input type="number" value={roundOff} onChange={(e) => setRoundOff(Number(e.target.value))} step={0.01} className={inputCls} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-green-700">
                  <span>Subtotal</span>
                  <span>₹{fmt(subtotal)}</span>
                </div>
                {invoiceDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- ₹{fmt(invoiceDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-green-600">
                  <span>GST Total</span>
                  <span>₹{fmt(gstTotal)}</span>
                </div>
                {tcsAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>TCS</span>
                    <span>₹{fmt(tcsAmount)}</span>
                  </div>
                )}
                {roundOff !== 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Round Off</span>
                    <span>₹{fmt(roundOff)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-900 pt-2 border-t border-green-200 text-lg">
                  <span>Grand Total</span>
                  <span>₹{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Bank & Terms */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">Bank & Terms</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Bank Details</label>
                <textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Bank Name, A/C No, IFSC, Branch" />
              </div>
              <div>
                <label className={labelCls}>Terms Title</label>
                <input type="text" value={termsTitle} onChange={(e) => setTermsTitle(e.target.value)} className={inputCls} placeholder="Terms & Conditions" />
                <label className={labelCls + ' mt-3 block'}>Terms Detail</label>
                <textarea value={termsDetail} onChange={(e) => setTermsDetail(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Payment due within 15 days..." />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className={cardCls}>
            <h4 className="text-sm font-bold text-green-800">Notes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Notes (on invoice)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Payment terms, additional info..." />
              </div>
              <div>
                <label className={labelCls}>Document Notes (internal)</label>
                <textarea value={documentNotes} onChange={(e) => setDocumentNotes(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Internal notes for reference..." />
              </div>
            </div>
          </div>

          {/* Link to order */}
          {orders.length > 0 && (
            <div>
              <label className={labelCls}>Link to Order (optional)</label>
              <select
                value={linkedOrderId}
                onChange={(e) => handleLinkOrder(e.target.value)}
                className={inputCls}
              >
                <option value="">No linked order</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.customer_name} - {o.product_name}</option>
                ))}
              </select>
            </div>
          )}
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

function HsnCodeInput({
  value,
  codes,
  onChange,
  onBlur,
}: {
  value: string;
  codes: HsnCode[];
  onChange: (val: string) => void;
  onBlur: (val: string) => void;
}) {
  const listId = useRef(`hsn-list-${Math.random().toString(36).slice(2)}`).current;
  const [focused, setFocused] = useState(false);

  const filtered = codes.filter(h =>
    h.code.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onBlur(e.target.value); }}
        placeholder="HSN/SAC"
        className="w-28 px-2 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-center uppercase"
        autoComplete="off"
      />
      <datalist id={listId}>
        {focused && filtered.map(h => (
          <option key={h.id} value={h.code}>
            {h.description ? `${h.code} - ${h.description}` : h.code}
          </option>
        ))}
      </datalist>
      <ChevronDown className="w-3 h-3 text-green-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
