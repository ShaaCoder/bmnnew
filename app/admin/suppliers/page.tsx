'use client';

import { useEffect, useState } from 'react';
import { supabase, type Supplier } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Loader as Loader2, X, Truck, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

type Form = {
  company_type: 'customer' | 'vendor' | 'customer_vendor';
  name: string;
  gstin: string;
  contact_person: string;
  phone: string;
  email: string;
  registration_type: 'regular' | 'composition' | 'unregistered' | 'consumer';
  pan: string;
  address: string;
  address_line_2: string;
  landmark: string;
  city: string;
  country: string;
  state: string;
  pincode: string;
  opening_balance: string;
  balance_type: 'credit' | 'debit';
  license_no: string;
  custom_field_1: string;
  custom_field_2: string;
  fax_no: string;
  website: string;
  credit_limit: string;
  due_days: string;
  notes: string;
  visible_on_documents: boolean;
};

type GstVerification = { status: 'verified' | 'error'; message: string } | null;

const emptyForm: Form = {
  company_type: 'vendor', name: '', gstin: '', contact_person: '', phone: '', email: '', registration_type: 'unregistered', pan: '',
  address: '', address_line_2: '', landmark: '', city: '', country: 'India', state: '', pincode: '', opening_balance: '0', balance_type: 'credit',
  license_no: '', custom_field_1: '', custom_field_2: '', fax_no: '', website: '', credit_limit: '0', due_days: '0', notes: '', visible_on_documents: true,
};

const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50';
const labelClass = 'block text-xs font-medium text-green-700 mb-1.5';

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [gstVerification, setGstVerification] = useState<GstVerification>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    setSuppliers((data as Supplier[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateForm = <K extends keyof Form>(field: K, value: Form[K]) => setForm((current) => ({ ...current, [field]: value }));

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setGstVerification(null); setModal('add'); setError(''); };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      company_type: supplier.company_type || 'vendor', name: supplier.name, gstin: supplier.gstin || '', contact_person: supplier.contact_person || '',
      phone: supplier.phone || '', email: supplier.email || '', registration_type: supplier.registration_type || 'unregistered', pan: supplier.pan || '',
      address: supplier.address || '', address_line_2: supplier.address_line_2 || '', landmark: supplier.landmark || '', city: supplier.city || '', country: supplier.country || 'India',
      state: supplier.state || '', pincode: supplier.pincode || '', opening_balance: String(supplier.opening_balance || 0), balance_type: supplier.balance_type || 'credit',
      license_no: supplier.license_no || '', custom_field_1: supplier.custom_field_1 || '', custom_field_2: supplier.custom_field_2 || '', fax_no: supplier.fax_no || '',
      website: supplier.website || '', credit_limit: String(supplier.credit_limit || 0), due_days: String(supplier.due_days || 0), notes: supplier.notes || '', visible_on_documents: supplier.visible_on_documents ?? true,
    });
    setGstVerification(null); setModal('edit'); setError('');
  };

  const verifyGstin = async () => {
    const gstin = form.gstin.toUpperCase().trim();
    updateForm('gstin', gstin);
    setGstVerification(null);
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      setGstVerification({ status: 'error', message: 'Enter a valid 15-character GSTIN.' });
      return;
    }

    setVerifyingGst(true);
    const { data, error: invokeError } = await supabase.functions.invoke('verify-gstin', { body: { gstin, include_profile: true } });
    setVerifyingGst(false);
    if (invokeError || !data?.success) {
      setGstVerification({ status: 'error', message: data?.error || invokeError?.message || 'GSTIN verification failed.' });
      return;
    }

    const profile = data.data as {
      legal_name?: string | null;
      trade_name?: string | null;
      business_name?: string | null;
      tradeName?: string | null;
      taxpayer_type?: string | null;
      address?: string | null;
      city?: string | null;
      pincode?: string | null;
      address_details?: { building_number?: string | null; building_name?: string | null; floor?: string | null; street?: string | null; locality?: string | null; district?: string | null; city?: string | null; state?: string | null; landmark?: string | null; pincode?: string | null };
    };
    const details = profile.address_details || {};
    const companyName = profile.trade_name || profile.business_name || profile.tradeName || profile.legal_name || '';
    const contactName = profile.legal_name && profile.legal_name.trim().toLowerCase() !== companyName.trim().toLowerCase() ? profile.legal_name : '';
    const addressLine = [details.building_number, details.building_name, details.floor, details.street].filter(Boolean).join(', ');
    const addressLineTwo = [details.locality, details.district].filter(Boolean).join(', ');
    const registrationType = profile.taxpayer_type?.toLowerCase().includes('composition') ? 'composition' : profile.taxpayer_type?.toLowerCase().includes('regular') ? 'regular' : 'unregistered';
    setForm((current) => ({
      ...current,
      name: companyName || current.name,
      contact_person: contactName || current.contact_person,
      registration_type: registrationType,
      address: addressLine || profile.address || current.address,
      address_line_2: addressLineTwo || current.address_line_2,
      landmark: details.landmark || current.landmark,
      city: details.city || profile.city || current.city,
      state: details.state || current.state,
      pincode: details.pincode || profile.pincode || current.pincode,
    }));
    setGstVerification({ status: 'verified', message: `${companyName || gstin} verified successfully.` });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { setError('Company name is required.'); return; }
    setSaving(true); setError('');
    const payload = {
      company_type: form.company_type, name: form.name.trim(), contact_person: form.contact_person.trim() || null, phone: form.phone.trim() || null,
      email: form.email.trim() || null, address: form.address.trim() || null, address_line_2: form.address_line_2.trim() || null, landmark: form.landmark.trim() || null,
      city: form.city.trim() || null, country: form.country.trim() || 'India', state: form.state.trim() || null, pincode: form.pincode.trim() || null,
      gstin: form.gstin.trim() || null, pan: form.pan.trim() || null, registration_type: form.registration_type, opening_balance: Number(form.opening_balance) || 0,
      balance_type: form.balance_type, license_no: form.license_no.trim() || null, custom_field_1: form.custom_field_1.trim() || null, custom_field_2: form.custom_field_2.trim() || null,
      fax_no: form.fax_no.trim() || null, website: form.website.trim() || null, credit_limit: Number(form.credit_limit) || 0, due_days: Number(form.due_days) || 0,
      payment_terms: form.due_days ? `${form.due_days} days` : null, notes: form.notes.trim() || null, visible_on_documents: form.visible_on_documents,
    };
    const { error: saveError } = editing ? await supabase.from('suppliers').update(payload).eq('id', editing.id) : await supabase.from('suppliers').insert(payload);
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setModal(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    setDeletingId(id); await supabase.from('suppliers').delete().eq('id', id); setDeletingId(null); load();
  };

  const filtered = suppliers.filter((supplier) => {
    const q = search.toLowerCase();
    return !q || supplier.name.toLowerCase().includes(q) || (supplier.phone || '').includes(q) || (supplier.gstin || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8"><div><h1 className="font-display text-3xl font-bold text-green-900">Suppliers</h1><p className="text-green-600 text-sm mt-1">Manage suppliers, GST details, terms and balances</p></div><button onClick={openAdd} className="flex items-center gap-2 bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"><Plus className="w-4 h-4" /> Add Supplier</button></div>
      <div className="relative mb-4 max-w-sm"><Search className="w-4 h-4 text-green-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-40 bg-green-100 rounded-2xl animate-pulse" />)}</div> : filtered.length === 0 ? <div className="text-center py-20 bg-white rounded-2xl border border-green-100"><Truck className="w-10 h-10 text-green-300 mx-auto mb-3" /><p className="text-green-600">No suppliers found. Add your first supplier.</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((supplier) => <div key={supplier.id} className="bg-white rounded-2xl border border-green-100 p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0"><Truck className="w-5 h-5 text-green-600" /></div><div><p className="font-medium text-green-900 text-sm">{supplier.name}</p><p className="text-xs text-green-500">{supplier.company_type === 'customer_vendor' ? 'Customer / Vendor' : supplier.company_type === 'customer' ? 'Customer' : 'Vendor'}</p></div></div><div className="flex gap-1"><button onClick={() => openEdit(supplier)} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(supplier.id)} disabled={deletingId === supplier.id} className="p-1.5 text-green-400 hover:text-red-600 hover:bg-red-50 rounded-lg">{deletingId === supplier.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button></div></div><div className="space-y-1 text-xs text-green-600">{supplier.phone && <p>Phone: {supplier.phone}</p>}{supplier.email && <p>Email: {supplier.email}</p>}{supplier.gstin && <p>GSTIN: {supplier.gstin}</p>}{supplier.city && <p>{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</p>}</div></div>)}</div>}

      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"><div className="flex items-center justify-between px-6 py-5 border-b border-green-100"><div><h3 className="font-display text-xl font-bold text-green-900">{modal === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3><p className="text-xs text-green-500 mt-1">Enter GSTIN and verify to auto-fill business details</p></div><button onClick={() => setModal(null)} className="p-1 hover:bg-green-100 rounded-lg"><X className="w-5 h-5 text-green-500" /></button></div><form onSubmit={handleSave}><div className="px-6 py-5 space-y-6 max-h-[74vh] overflow-y-auto">{error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <section><h4 className="font-semibold text-green-900 border-b border-green-100 pb-2 mb-4">Supplier Details</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><label className={labelClass}>Company Type</label><div className="flex flex-wrap gap-4 text-sm text-green-800"><label className="flex items-center gap-2"><input type="radio" checked={form.company_type === 'customer'} onChange={() => updateForm('company_type', 'customer')} /> Customer</label><label className="flex items-center gap-2"><input type="radio" checked={form.company_type === 'vendor'} onChange={() => updateForm('company_type', 'vendor')} /> Vendor</label><label className="flex items-center gap-2"><input type="radio" checked={form.company_type === 'customer_vendor'} onChange={() => updateForm('company_type', 'customer_vendor')} /> Customer / Vendor</label></div></div><div className="sm:col-span-2"><label className={labelClass}>GSTIN</label><div className="flex gap-2"><input value={form.gstin} onChange={(e) => { updateForm('gstin', e.target.value.toUpperCase()); setGstVerification(null); }} maxLength={15} placeholder="27ABCDE1234F1Z5" className={`${inputClass} uppercase`} /><button type="button" onClick={verifyGstin} disabled={verifyingGst || !form.gstin.trim()} className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-green-700 border border-green-200 rounded-xl hover:bg-green-50 disabled:opacity-50"><ShieldCheck className="w-3.5 h-3.5" />{verifyingGst ? 'Checking' : 'Verify'}</button></div>{gstVerification && <div className={`flex gap-1.5 items-start mt-2 text-xs ${gstVerification.status === 'verified' ? 'text-green-700' : 'text-red-600'}`}>{gstVerification.status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" />}<span>{gstVerification.message}</span></div>}</div><div className="sm:col-span-2"><label className={labelClass}>Company Name *</label><input value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={inputClass} required /></div><div><label className={labelClass}>Contact Person</label><input value={form.contact_person} onChange={(e) => updateForm('contact_person', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Contact No.</label><input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Email</label><input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Registration Type</label><select value={form.registration_type} onChange={(e) => updateForm('registration_type', e.target.value as Form['registration_type'])} className={inputClass}><option value="unregistered">Unregistered</option><option value="regular">Regular</option><option value="composition">Composition</option><option value="consumer">Consumer</option></select></div><div><label className={labelClass}>PAN</label><input value={form.pan} onChange={(e) => updateForm('pan', e.target.value.toUpperCase())} className={`${inputClass} uppercase`} /></div></div></section>

        <section><h4 className="font-semibold text-green-900 border-b border-green-100 pb-2 mb-4">Billing Address</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><label className={labelClass}>Address</label><input value={form.address} onChange={(e) => updateForm('address', e.target.value)} className={inputClass} /></div><div className="sm:col-span-2"><label className={labelClass}>Address Line 2</label><input value={form.address_line_2} onChange={(e) => updateForm('address_line_2', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Landmark</label><input value={form.landmark} onChange={(e) => updateForm('landmark', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>City</label><input value={form.city} onChange={(e) => updateForm('city', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Country</label><input value={form.country} onChange={(e) => updateForm('country', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>State</label><input value={form.state} onChange={(e) => updateForm('state', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Pincode</label><input value={form.pincode} onChange={(e) => updateForm('pincode', e.target.value)} className={inputClass} /></div></div></section>

        <section><h4 className="font-semibold text-green-900 border-b border-green-100 pb-2 mb-4">Opening Balance</h4><div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Supplier Balance</label><input type="number" min="0" step="0.01" value={form.opening_balance} onChange={(e) => updateForm('opening_balance', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Balance Type</label><select value={form.balance_type} onChange={(e) => updateForm('balance_type', e.target.value as Form['balance_type'])} className={inputClass}><option value="credit">Credit</option><option value="debit">Debit</option></select></div></div></section>

        <section><h4 className="font-semibold text-green-900 border-b border-green-100 pb-2 mb-4">Custom Fields</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelClass}>License No.</label><input value={form.license_no} onChange={(e) => updateForm('license_no', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Custom Field 1</label><input value={form.custom_field_1} onChange={(e) => updateForm('custom_field_1', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Custom Field 2</label><input value={form.custom_field_2} onChange={(e) => updateForm('custom_field_2', e.target.value)} className={inputClass} /></div></div></section>

        <section><h4 className="font-semibold text-green-900 border-b border-green-100 pb-2 mb-4">Additional Details</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelClass}>Fax No.</label><input value={form.fax_no} onChange={(e) => updateForm('fax_no', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Website</label><input value={form.website} onChange={(e) => updateForm('website', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Credit Limit</label><input type="number" min="0" step="0.01" value={form.credit_limit} onChange={(e) => updateForm('credit_limit', e.target.value)} className={inputClass} /></div><div><label className={labelClass}>Due Days</label><input type="number" min="0" value={form.due_days} onChange={(e) => updateForm('due_days', e.target.value)} className={inputClass} /></div><div className="sm:col-span-2"><label className={labelClass}>Note</label><textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div><label className="sm:col-span-2 flex items-center gap-2 text-sm text-green-800"><input type="checkbox" checked={form.visible_on_documents} onChange={(e) => updateForm('visible_on_documents', e.target.checked)} className="accent-green-600" /> Company will be visible on all documents.</label></div></section>
      </div><div className="px-6 py-4 border-t border-green-100 flex gap-3"><button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-70">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Save Supplier'}</button></div></form></div></div>}
    </div>
  );
}
