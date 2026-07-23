'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase, type Order, type CompanySettings } from '@/lib/supabase';

type Props = {
  order: Order;
  onClose: () => void;
};

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ones[h] + ' Hundred' : '') + (r ? (h ? ' ' : '') + twoDigits(r) : '');
}

function numberToWords(num: number): string {
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rem = rupees % 1000;
  let words = '';
  if (crore) words += twoDigits(crore) + ' Crore ';
  if (lakh) words += twoDigits(lakh) + ' Lakh ';
  if (thousand) words += twoDigits(thousand) + ' Thousand ';
  if (rem) words += threeDigits(rem);
  if (!words) words = 'Zero';
  words += ' Rupees';
  if (paise > 0) words += ' and ' + twoDigits(paise) + ' Paise';
  return words + ' Only';
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function InvoiceModal({ order, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [upiQr, setUpiQr] = useState('');

  useEffect(() => {
    supabase.from('company_settings').select('*').single().then(({ data }) => {
      if (!data) return;
      setSettings(data);
      if (data.upi_id) {
        const grandTotal = baseAmount + gstAmount;
        QRCode.toDataURL(
          `upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.company_name)}&am=${grandTotal.toFixed(2)}&cu=INR`
        ).then(setUpiQr).catch(() => {});
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gstRate = Number(order.gst_percentage ?? 18);
  const baseAmount = Number(order.product_price) * Number(order.quantity);
  const gstAmount = (baseAmount * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const grandTotal = baseAmount + gstAmount;

  const invoiceNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const companyName = settings?.company_name || 'Your Company';
  const companyAddress = settings?.address || '';
  const companyPhone = settings?.phone || '';
  const companyEmail = settings?.email || '';
  const companyGstin = settings?.gstin || '';
  const companyPan = settings?.pan || '';
  const bankName = settings?.bank_name || '';
  const accountNumber = settings?.account_number || '';
  const ifscCode = settings?.ifsc_code || '';
  const branch = settings?.branch || '';
  const upiId = settings?.upi_id || '';
  const logoUrl = settings?.logo_url || '/bmn_logo.jpeg';

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Invoice ${invoiceNo}</title>
<style>
@page { size: A4 portrait; margin: 8mm; }
* { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
html, body { width:210mm; background:white; color:#222; font-size:11px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.invoice-box { width:100%; max-width:194mm; margin:auto; border:1px solid #ddd; }
img { display:block; max-width:100%; }
.gstin-bar { background:#14532d; color:white; padding:6px 16px; font-size:10px; display:flex; justify-content:space-between; }
.header { display:flex; justify-content:space-between; align-items:flex-start; padding:16px; border-bottom:2px solid #14532d; }
.logo-area { display:flex; gap:10px; align-items:center; }
.logo-area img { width:50px; height:50px; border-radius:50%; object-fit:cover; }
.company-name { font-size:17px; font-weight:bold; color:#14532d; }
.company-addr { font-size:9.5px; color:#666; line-height:1.5; margin-top:2px; }
.invoice-title { font-size:22px; font-weight:bold; color:#14532d; }
.invoice-meta { text-align:right; font-size:10px; color:#666; margin-top:4px; }
.bill-section { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #e5e7eb; }
.bill-box { padding:14px 16px; }
.bill-box + .bill-box { border-left:1px solid #e5e7eb; }
.bill-label { font-size:8.5px; color:#16a34a; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }
.bill-name { font-size:13px; font-weight:bold; color:#14532d; }
.bill-detail { font-size:9.5px; color:#555; line-height:1.6; margin-top:2px; }
table { width:100%; border-collapse:collapse; }
th { background:#14532d; color:white; font-size:9px; text-transform:uppercase; padding:7px 8px; text-align:left; }
th.rt, td.rt { text-align:right; }
th.ct, td.ct { text-align:center; }
td { font-size:10px; padding:6px 8px; border-bottom:1px solid #e5e7eb; }
.summary-section { display:grid; grid-template-columns:1fr 290px; border-top:1px solid #e5e7eb; }
.amount-words { padding:14px 16px; }
.amount-label { font-size:8.5px; color:#16a34a; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
.amount-text { font-size:11px; color:#14532d; font-weight:600; font-style:italic; }
.summary-table { border-left:1px solid #e5e7eb; }
.summary-table td { border:none; padding:4px 12px; font-size:10px; }
.summary-table .grand td { font-weight:bold; font-size:13px; color:#14532d; border-top:2px solid #14532d; padding-top:8px; }
.bank-section { display:grid; grid-template-columns:1fr 1fr; background:#f0fdf4; border-top:1px solid #e5e7eb; }
.bank-box { padding:14px 16px; }
.bank-box + .bank-box { border-left:1px solid #bbf7d0; }
.bank-label { font-size:8.5px; color:#16a34a; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
.bank-detail { font-size:9.5px; color:#555; line-height:1.8; }
.bank-detail span { font-weight:600; color:#14532d; }
.bank-detail img { width:80px; height:80px; margin-top:8px; }
.sign-section { display:grid; grid-template-columns:1fr 200px; padding:14px 16px; border-top:1px solid #e5e7eb; align-items:end; gap:20px; }
.sign-note { font-size:9.5px; color:#666; line-height:1.5; }
.sign-right { text-align:right; }
.sign-right img { max-height:48px; max-width:160px; margin-left:auto; object-fit:contain; }
.sign-name { font-size:9.5px; color:#14532d; font-weight:600; margin-top:4px; }
.sign-sub { font-size:8.5px; color:#888; }
.footer { background:#14532d; color:#d1fae5; text-align:center; padding:8px; font-size:9.5px; }
@media print { body { margin:0; padding:0; } .invoice-box { border:none; } }
</style>
</head>
<body>
${invoiceRef.current.innerHTML}
</body>
</html>`);

    win.document.close();
    win.onload = () => {
      const images = win.document.images;
      if (images.length === 0) { setTimeout(() => { win.focus(); win.print(); win.close(); }, 300); return; }
      let loaded = 0;
      const finish = () => { if (++loaded === images.length) setTimeout(() => { win.focus(); win.print(); win.close(); }, 400); };
      Array.from(images).forEach(img => img.complete ? finish() : (img.onload = finish, img.onerror = finish));
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">
          <div>
            <h3 className="font-display text-xl font-bold text-green-900">Tax Invoice</h3>
            <p className="text-xs text-green-500 mt-0.5">{invoiceNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-green-500" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="overflow-y-auto p-6 bg-gray-50">
          <div ref={invoiceRef} className="invoice-box bg-white border border-gray-200 overflow-hidden max-w-[780px] mx-auto text-[11px]">

            {/* GSTIN bar */}
            <div className="gstin-bar bg-green-900 text-green-100 px-4 py-1.5 text-[10px] flex justify-between items-center">
              <span>GSTIN: <strong>{companyGstin || '—'}</strong></span>
              {companyPan && <span>PAN: <strong>{companyPan}</strong></span>}
              <span>TAX INVOICE</span>
            </div>

            {/* Header */}
            <div className="header flex justify-between items-start px-5 py-4 border-b-2 border-green-900">
              <div className="logo-area flex items-center gap-3">
                <Image
                  src={logoUrl}
                  alt={companyName}
                  width={50}
                  height={50}
                  className="rounded-full object-cover border-2 border-green-100"
                  unoptimized
                />
                <div>
                  <div className="company-name text-lg font-bold text-green-900">{companyName}</div>
                  {companyAddress && (
                    <div className="company-addr text-[10px] text-gray-500 mt-0.5 leading-snug max-w-xs">{companyAddress}</div>
                  )}
                  <div className="company-addr text-[10px] text-gray-500">
                    {companyPhone && <span>Ph: {companyPhone}</span>}
                    {companyPhone && companyEmail && <span> &middot; </span>}
                    {companyEmail && <span>{companyEmail}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-900">TAX INVOICE</div>
                <div className="text-[11px] text-gray-500 mt-1">No: <strong>{invoiceNo}</strong></div>
                <div className="text-[11px] text-gray-500">Date: {invoiceDate}</div>
              </div>
            </div>

            {/* Bill From / Bill To */}
            <div className="bill-section grid grid-cols-2 border-b border-gray-200">
              <div className="bill-box px-4 py-3">
                <div className="bill-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Bill From</div>
                <div className="bill-name text-sm font-bold text-green-900">{companyName}</div>
                <div className="bill-detail text-[10px] text-gray-600 leading-relaxed mt-0.5">
                  {companyAddress && <div>{companyAddress}</div>}
                  {companyPhone && <div>Ph: {companyPhone}</div>}
                  {companyEmail && <div>{companyEmail}</div>}
                  {companyGstin && <div>GSTIN: <span className="font-semibold text-green-800">{companyGstin}</span></div>}
                  {companyPan && <div>PAN: <span className="font-semibold text-green-800">{companyPan}</span></div>}
                </div>
              </div>
              <div className="bill-box px-4 py-3 border-l border-gray-200">
                <div className="bill-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Bill To</div>
                <div className="bill-name text-sm font-bold text-green-900">{order.customer_name}</div>
                <div className="bill-detail text-[10px] text-gray-600 leading-relaxed mt-0.5">
                  {order.customer_address && <div>{order.customer_address}</div>}
                  {order.customer_phone && <div>Ph: {order.customer_phone}</div>}
                  {order.customer_email && <div>{order.customer_email}</div>}
                </div>
              </div>
            </div>

            {/* Items table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-900 text-white">
                  <th className="text-left text-[9px] uppercase px-3 py-2 w-6">#</th>
                  <th className="text-left text-[9px] uppercase px-3 py-2">Description</th>
                  <th className="text-center text-[9px] uppercase px-2 py-2">Qty</th>
                  <th className="text-right text-[9px] uppercase px-3 py-2">Unit Price</th>
                  <th className="text-right text-[9px] uppercase px-3 py-2">Base Amount</th>
                  <th className="text-center text-[9px] uppercase px-2 py-2">GST%</th>
                  <th className="text-right text-[9px] uppercase px-3 py-2">CGST</th>
                  <th className="text-right text-[9px] uppercase px-3 py-2">SGST</th>
                  <th className="text-right text-[9px] uppercase px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="text-center text-[11px] px-3 py-2.5 text-gray-500">1</td>
                  <td className="text-left text-[11px] px-3 py-2.5 text-green-800 font-medium">{order.product_name}</td>
                  <td className="text-center text-[11px] px-2 py-2.5">{order.quantity}</td>
                  <td className="text-right text-[11px] px-3 py-2.5">&#8377;{fmt(Number(order.product_price))}</td>
                  <td className="text-right text-[11px] px-3 py-2.5">&#8377;{fmt(baseAmount)}</td>
                  <td className="text-center text-[11px] px-2 py-2.5">{gstRate}%</td>
                  <td className="text-right text-[11px] px-3 py-2.5">&#8377;{fmt(cgst)}</td>
                  <td className="text-right text-[11px] px-3 py-2.5">&#8377;{fmt(sgst)}</td>
                  <td className="text-right text-[11px] px-3 py-2.5 font-semibold text-green-900">&#8377;{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Summary section */}
            <div className="summary-section grid border-t border-gray-200" style={{ gridTemplateColumns: '1fr 290px' }}>
              <div className="amount-words px-4 py-3 border-r border-gray-200">
                <div className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Amount in Words</div>
                <div className="text-[11px] text-green-900 font-semibold italic">{numberToWords(grandTotal)}</div>
                {order.notes && (
                  <div className="mt-2">
                    <div className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Notes</div>
                    <div className="text-[10px] text-gray-600">{order.notes}</div>
                  </div>
                )}
              </div>
              <div className="summary-table">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="text-left text-[11px] text-gray-600 px-3 py-1 border-none">Subtotal (Base)</td>
                      <td className="text-right text-[11px] px-3 py-1 border-none">&#8377;{fmt(baseAmount)}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-[11px] text-gray-600 px-3 py-1 border-none">CGST ({gstRate / 2}%)</td>
                      <td className="text-right text-[11px] px-3 py-1 border-none">&#8377;{fmt(cgst)}</td>
                    </tr>
                    <tr>
                      <td className="text-left text-[11px] text-gray-600 px-3 py-1 border-none">SGST ({gstRate / 2}%)</td>
                      <td className="text-right text-[11px] px-3 py-1 border-none">&#8377;{fmt(sgst)}</td>
                    </tr>
                    <tr className="grand">
                      <td className="text-left text-sm font-bold text-green-900 border-t-2 border-green-900 px-3 pt-2 pb-1 border-none">Grand Total</td>
                      <td className="text-right text-sm font-bold text-green-900 border-t-2 border-green-900 px-3 pt-2 pb-1 border-none">&#8377;{fmt(grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank details + Tax summary */}
            {(bankName || accountNumber || upiId) && (
              <div className="bank-section grid grid-cols-2 bg-green-50 border-t border-gray-200">
                <div className="bank-box px-4 py-3">
                  <div className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Bank Details</div>
                  <div className="text-[10px] text-gray-600 leading-relaxed">
                    {bankName && <div>Bank: <span className="font-semibold text-green-900">{bankName}</span></div>}
                    {accountNumber && <div>A/C No: <span className="font-semibold text-green-900">{accountNumber}</span></div>}
                    {ifscCode && <div>IFSC: <span className="font-semibold text-green-900">{ifscCode}</span></div>}
                    {branch && <div>Branch: <span className="font-semibold text-green-900">{branch}</span></div>}
                    {upiId && <div>UPI: <span className="font-semibold text-green-900">{upiId}</span></div>}
                    {upiQr && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upiQr} alt="UPI QR" className="w-20 h-20 border rounded bg-white p-1" />
                        <p className="text-[9px] text-gray-500 mt-1">Scan to Pay</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bank-box px-4 py-3 border-l border-green-200">
                  <div className="text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Tax Summary</div>
                  <div className="text-[10px] text-gray-600 leading-relaxed">
                    <div>Taxable Amount: <span className="font-semibold text-green-900">&#8377;{fmt(baseAmount)}</span></div>
                    <div>CGST ({gstRate / 2}%): <span className="font-semibold text-green-900">&#8377;{fmt(cgst)}</span></div>
                    <div>SGST ({gstRate / 2}%): <span className="font-semibold text-green-900">&#8377;{fmt(sgst)}</span></div>
                    <div className="font-semibold mt-0.5">Total Tax: <span className="text-green-900">&#8377;{fmt(gstAmount)}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Signature */}
            <div className="sign-section grid px-5 py-4 border-t border-gray-200" style={{ gridTemplateColumns: '1fr 200px', alignItems: 'end', gap: '20px' }}>
              <div className="sign-note text-[9.5px] text-gray-500 leading-relaxed">
                This is a computer-generated invoice and does not require a physical signature.
              </div>
              <div className="sign-right text-right">
                <div className="text-[10px] text-gray-600 mb-1">For <span className="font-bold text-green-900">{companyName}</span></div>
                {settings?.signature_url && (
                  <Image
                    src={settings.signature_url}
                    alt="Signature"
                    width={160}
                    height={48}
                    className="h-12 ml-auto object-contain"
                    unoptimized
                  />
                )}
                <div className="text-[9px] text-gray-500 mt-1">Authorised Signatory</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer bg-green-900 text-green-100 px-5 py-2 text-[10px] text-center">
              Thank you for your business! &middot; {companyName}
              {companyPhone && <> &middot; {companyPhone}</>}
              {companyEmail && <> &middot; {companyEmail}</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
