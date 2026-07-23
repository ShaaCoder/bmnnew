'use client';

import { useEffect, useState } from 'react';
import { supabase, type CompanySettings } from '@/lib/supabase';
import { Save, Loader as Loader2, Building2 } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminSettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

 useEffect(() => {
  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error(error);
    } else {
      setSettings(data);
    }

    setLoading(false);
  };

  loadSettings();
}, []);

  const update = (field: keyof CompanySettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const updateImageUrl = (field: keyof CompanySettings, urls: string[]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: urls[0] || null });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
 const { data, error } = await supabase
  .from("company_settings")
  .update({
    company_name: settings.company_name,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    gstin: settings.gstin,
    pan: settings.pan,
    bank_name: settings.bank_name,
    account_number: settings.account_number,
    ifsc_code: settings.ifsc_code,
    branch: settings.branch,
    upi_id: settings.upi_id,
    logo_url: settings.logo_url,
    signature_url: settings.signature_url,
    qr_code_url: settings.qr_code_url,
  })
  .eq("id", settings.id)
  .select();

console.log("Updated row:", data);
console.log("Error:", error);

if (error) {
  console.error(error);
}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 bg-green-100 rounded-xl w-64 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-green-50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const inputClass = 'w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400';
  const labelClass = 'text-xs font-medium text-green-600 uppercase tracking-wide';

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">Company Settings</h1>
          <p className="text-green-600 text-sm mt-1">Configure your business details for invoices</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-green-900 mb-4">Company Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={settings?.company_name || ''} onChange={e => update('company_name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input className={inputClass} value={settings?.tagline || ''} onChange={e => update('tagline', e.target.value)} placeholder="GST Invoice" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={settings?.phone || ''} onChange={e => update('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={settings?.email || ''} onChange={e => update('email', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <textarea className={inputClass} rows={2} value={settings?.address || ''} onChange={e => update('address', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Company Branding */}
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-green-900 mb-4">Company Branding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ImageUploader
              value={settings?.logo_url ? [settings.logo_url] : []}
              onChange={(urls) => updateImageUrl('logo_url', urls)}
              folder="company"
              max={1}
              label="Company Logo"
              bucket="companyassets"
            />
          </div>
          <div>
            <ImageUploader
              value={settings?.signature_url ? [settings.signature_url] : []}
              onChange={(urls) => updateImageUrl('signature_url', urls)}
              folder="company"
              max={1}
              label="Digital Signature"
              bucket="companyassets"
            />
          </div>
          <div className="sm:col-span-2">
            <ImageUploader
              value={settings?.qr_code_url ? [settings.qr_code_url] : []}
              onChange={(urls) => updateImageUrl('qr_code_url', urls)}
              folder="company"
              max={1}
              label="QR Code (Optional)"
              bucket="companyassets"
            />
          </div>
        </div>
      </div>

      {/* Tax Info */}
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-green-900 mb-4">Tax Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>GSTIN</label>
            <input className={`${inputClass} uppercase`} value={settings?.gstin || ''} onChange={e => update('gstin', e.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" />
          </div>
          <div>
            <label className={labelClass}>PAN</label>
            <input className={`${inputClass} uppercase`} value={settings?.pan || ''} onChange={e => update('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">
        <h2 className="font-display text-lg font-bold text-green-900 mb-4">Bank Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bank Name</label>
            <input className={inputClass} value={settings?.bank_name || ''} onChange={e => update('bank_name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Account Number</label>
            <input className={inputClass} value={settings?.account_number || ''} onChange={e => update('account_number', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>IFSC Code</label>
            <input className={`${inputClass} uppercase`} value={settings?.ifsc_code || ''} onChange={e => update('ifsc_code', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelClass}>Branch</label>
            <input className={inputClass} value={settings?.branch || ''} onChange={e => update('branch', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>UPI ID</label>
            <input className={inputClass} value={settings?.upi_id || ''} onChange={e => update('upi_id', e.target.value)} placeholder="bharatadvance@upi" />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-800 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Settings saved successfully!</span>}
      </div>
    </div>
  );
}
