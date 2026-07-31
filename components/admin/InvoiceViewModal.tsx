'use client';

import { useRef, useEffect, useState } from 'react';
import { type Invoice, type InvoiceItem, type CompanySettings, supabase } from '@/lib/supabase';
import { X, Printer } from 'lucide-react';
import Image from 'next/image';
import QRCode from "qrcode";
type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  onClose: () => void;
};

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = '';
  if (h) s += ones[h] + ' Hundred';
  if (r) s += (h ? ' ' : '') + twoDigits(r);
  return s;
}

function numberToWords(num: number): string {
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let words = '';
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;
  if (crore) words += twoDigits(crore) + ' Crore ';
  if (lakh) words += twoDigits(lakh) + ' Lakh ';
  if (thousand) words += twoDigits(thousand) + ' Thousand ';
  if (hundred) words += threeDigits(hundred);
  if (!words) words = 'Zero';
  words += ' Rupees';
  if (paise > 0) words += ' and ' + twoDigits(paise) + ' Paise';
  words += ' Only';
  return words;
}

export default function InvoiceViewModal({ invoice, items, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
const [upiQr, setUpiQr] = useState("");
useEffect(() => {
  const loadCompany = async () => {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Company Settings Error:", error);
      return;
    }

    console.log("Company Settings:", data);

    setSettings(data);

    // Generate Dynamic UPI QR Code
    if (data?.upi_id) {
      try {
        const qr = await QRCode.toDataURL(
          `upi://pay?pa=${data.upi_id}` +
          `&pn=${encodeURIComponent(data.company_name)}` +
          `&am=${Number(invoice.grand_total).toFixed(2)}` +
          `&cu=INR`
        );

        setUpiQr(qr);
      } catch (err) {
        console.error("QR Generation Error:", err);
      }
    }
  };

  loadCompany();
}, [invoice.grand_total]);

  const companyName = settings?.company_name || 'Bharat Advance';
  const companyAddress = settings?.address || '123 Business Avenue, Commercial District, City - 400001';
  const companyPhone = settings?.phone || '+91 98765 43210';
  const companyEmail = settings?.email || 'info@bharatadvance.com';
  const companyGstin = settings?.gstin || '';
  const companyPan = settings?.pan || '';
  const bankName = settings?.bank_name || '';
  const accountNumber = settings?.account_number || '';
  const ifscCode = settings?.ifsc_code || '';
  const branch = settings?.branch || '';
  const upiId = settings?.upi_id || '';

 const handlePrint = () => {
  if (!invoiceRef.current) return;

  const printWindow = window.open("", "_blank", "width=1000,height=900");

  if (!printWindow) return;

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Invoice ${invoice.invoice_number}</title>

<style>

@page{
    size:A4 portrait;
    margin:8mm;
}

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
}

html,
body{
    width:210mm;
    background:white;
    color:#222;
    font-size:11px;
    margin:0;
    padding:0;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
}

.invoice-box{
    width:100%;
    max-width:194mm;
    margin:auto;
    border:1px solid #ddd;
    overflow:hidden;
}

img{
    display:block;
    max-width:100%;
}

.gstin-bar,
.header,
.bill-section,
.summary-section,
.bank-section,
.sign-section,
.footer,
table{
    page-break-inside:avoid;
    break-inside:avoid;
}

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    padding:16px;
    border-bottom:2px solid #14532d;
}

.logo-area{
    display:flex;
    gap:12px;
    align-items:center;
}

.logo-area img{
    width:48px;
    height:48px;
    border-radius:50%;
    object-fit:cover;
}

.company-name{
    font-size:18px;
    font-weight:bold;
    color:#14532d;
}

.company-addr{
    font-size:10px;
    color:#666;
    line-height:1.4;
}

.invoice-title{
    font-size:24px;
    font-weight:bold;
    color:#14532d;
}

.invoice-meta{
    text-align:right;
}

.bill-section{
    display:grid;
    grid-template-columns:1fr 1fr;
}

.bill-box{
    padding:14px;
}

.bill-label{
    font-size:9px;
    color:#16a34a;
    font-weight:bold;
    text-transform:uppercase;
    margin-bottom:5px;
}

.bill-name{
    font-size:14px;
    font-weight:bold;
    color:#14532d;
}

.bill-detail{
    font-size:10px;
    color:#555;
    line-height:1.5;
}

table{
    width:100%;
    border-collapse:collapse;
}

th{
    background:#14532d;
    color:white;
    font-size:9px;
    padding:8px;
}

td{
    font-size:10px;
    padding:6px;
    border-bottom:1px solid #ddd;
}

.summary-section{
    display:grid;
    grid-template-columns:1fr 280px;
}

.amount-words{
    padding:14px;
}

.summary-table{
    width:100%;
}

.summary-table td{
    border:none;
    padding:4px 12px;
}

.bank-section{
    display:grid;
    grid-template-columns:1fr 1fr;
}

.bank-box{
    padding:14px;
    background:#f0fdf4;
}

.bank-label{
    font-size:9px;
    color:#16a34a;
    font-weight:bold;
    margin-bottom:6px;
}

.bank-detail{
    font-size:10px;
    line-height:1.6;
}

.bank-detail img{
    width:85px;
    height:85px;
    margin-top:8px;
}

.sign-section{
    display:grid;
    grid-template-columns:1fr 220px;
    gap:20px;
    align-items:end;
    padding:16px;
}

.sign-left{
    font-size:10px;
    color:#666;
    line-height:1.5;
}

.sign-right{
    text-align:right;
}

.sign-right img{
    max-height:50px;
    max-width:180px;
    margin-left:auto;
    object-fit:contain;
}

.footer{
    background:#14532d;
    color:white;
    text-align:center;
    padding:8px;
    font-size:10px;
}

@media print{

    body{
        margin:0;
        padding:0;
    }

    .invoice-box{
        border:none;
    }

}

</style>

</head>

<body>

${invoiceRef.current.innerHTML}

</body>
</html>
`);

  printWindow.document.close();

  printWindow.onload = () => {

    const images = printWindow.document.images;

    if (images.length === 0) {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      return;
    }

    let loaded = 0;

    const finish = () => {
      loaded++;

      if (loaded === images.length) {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 400);
      }
    };

    Array.from(images).forEach((img) => {

      if (img.complete) {
        finish();
      } else {
        img.onload = finish;
        img.onerror = finish;
      }

    });

  };

};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">
          <h3 className="font-display text-xl font-bold text-green-900">Tax Invoice {invoice.invoice_number}</h3>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-green-500" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="overflow-y-auto p-6 bg-gray-50" ref={invoiceRef}>
          <div className="invoice-box bg-white border border-gray-200 rounded-lg overflow-hidden max-w-[800px] mx-auto">
            {/* GSTIN bar */}
            <div className="gstin-bar bg-green-900 text-white px-5 py-1.5 text-[11px] flex justify-between">
              <span>GSTIN: {companyGstin || '—'}</span>
              {/* <span>PAN: {companyPan || '—'}</span> */}
              {/* <span>State: 27-Maharashtra</span> */}
            </div>

            {/* Header */}
            <div className="header flex justify-between items-start px-5 py-5 border-b-2 border-green-900">
              <div className="logo-area flex items-center gap-3">
               <Image
  src={settings?.logo_url || "/bmn_logo.jpeg"}
  alt={companyName}
  width={48}
  height={48}
  className="rounded-full object-cover"
  unoptimized
/>
                <div>
                  <div className="company-name text-lg font-bold text-green-900">{companyName}</div>
                  <div className="company-addr text-[10px] text-gray-500 mt-0.5 leading-tight">{companyAddress}</div>
                  <div className="company-addr text-[10px] text-gray-500">Ph: {companyPhone} &middot; {companyEmail}</div>
                </div>
              </div>
              <div className="invoice-meta text-right">
                <div className="invoice-title text-2xl font-bold text-green-900">TAX INVOICE</div>
                <div className="invoice-no text-[11px] text-gray-500 mt-1">No: {invoice.invoice_number}</div>
                <div className="invoice-no text-[11px] text-gray-500">Date: {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                {invoice.due_date && <div className="invoice-no text-[11px] text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>}
              </div>
            </div>

            {/* Bill To / Place of Supply */}
            <div className="bill-section flex gap-px bg-gray-200">
              <div className="bill-box flex-1 px-4 py-3 bg-white">
                <div className="bill-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Bill To</div>
                <div className="bill-name text-sm font-bold text-green-900">{invoice.customer_name}</div>
                <div className="bill-detail text-[10px] text-gray-600 leading-relaxed mt-0.5">
                  {invoice.customer_address && <div>{invoice.customer_address}</div>}
                  {invoice.customer_phone && <div>Ph: {invoice.customer_phone}</div>}
                  {invoice.customer_email && <div>{invoice.customer_email}</div>}
                  {invoice.customer_gst && <div>GSTIN: <span className="font-semibold">{invoice.customer_gst}</span></div>}
                  {invoice.customer_pan && <div>PAN: <span className="font-semibold">{invoice.customer_pan}</span></div>}
                </div>
              </div>
              <div className="bill-box flex-1 px-4 py-3 bg-white">
                <div className="bill-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Details</div>
                <div className="bill-detail text-[10px] text-gray-600 leading-relaxed">
                  <div>Place of Supply: <span className="font-semibold text-green-900">{invoice.place_of_supply || '—'}</span></div>
                  <div className="mt-2">Payment Terms: <span className="font-semibold">{invoice.due_date ? 'Credit' : 'Advance'}</span></div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-900 text-white">
                  <th className="desc text-left text-[9px] uppercase px-2 py-2">#</th>
                  <th className="desc text-left text-[9px] uppercase px-2 py-2">Description</th>
                  <th className="text-[9px] uppercase px-1 py-2">HSN/SAC</th>
                  <th className="text-[9px] uppercase px-1 py-2">Unit</th>
                  <th className="text-[9px] uppercase px-1 py-2">Qty</th>
                  <th className="rt text-right text-[9px] uppercase px-2 py-2">Rate</th>
                  <th className="rt text-right text-[9px] uppercase px-2 py-2">Base</th>
                  <th className="text-[9px] uppercase px-1 py-2">GST%</th>
                  <th className="rt text-right text-[9px] uppercase px-2 py-2">CGST</th>
                  <th className="rt text-right text-[9px] uppercase px-2 py-2">SGST</th>
                  <th className="rt text-right text-[9px] uppercase px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const base = Number(it.base_amount);
                  const gst = Number(it.gst_amount);
                  const total = Number(it.total);
                  const cgst = gst / 2;
                  const sgst = gst / 2;
                  return (
                    <tr key={it.id} className="border-b border-gray-200">
                      <td className="desc text-left text-[11px] px-2 py-2 text-center">{idx + 1}</td>
                      <td className="desc text-left text-[11px] px-2 py-2">{it.description}</td>
                      <td className="text-[11px] px-1 py-2 text-center">{it.hsn_sac_code || '—'}</td>
                      <td className="text-[11px] px-1 py-2 text-center">{it.unit || 'NOS'}</td>
                      <td className="text-[11px] px-1 py-2 text-center">{fmt0(it.quantity)}</td>
                      <td className="rt text-right text-[11px] px-2 py-2">{fmt(Number(it.unit_price))}</td>
                      <td className="rt text-right text-[11px] px-2 py-2">{fmt(base)}</td>
                      <td className="text-[11px] px-1 py-2 text-center">{Number(it.gst_percentage)}%</td>
                      <td className="rt text-right text-[11px] px-2 py-2">{fmt(cgst)}</td>
                      <td className="rt text-right text-[11px] px-2 py-2">{fmt(sgst)}</td>
                      <td className="rt text-right text-[11px] px-2 py-2 font-semibold">{fmt(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary section */}
            <div className="summary-section flex gap-px bg-gray-200">
              <div className="amount-words flex-1 px-4 py-3 bg-white">
                <div className="amount-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1">Amount in Words</div>
                <div className="amount-text text-[11px] text-green-900 font-semibold">{numberToWords(Number(invoice.grand_total))}</div>
              </div>
              <div className="summary-table w-[280px]">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="label text-left text-[11px] text-gray-600 border-none px-3 py-1">Subtotal</td>
                      <td className="text-right text-[11px] border-none px-3 py-1">&#8377;{fmt(Number(invoice.subtotal))}</td>
                    </tr>
                    <tr>
                      <td className="label text-left text-[11px] text-gray-600 border-none px-3 py-1">CGST</td>
                      <td className="text-right text-[11px] border-none px-3 py-1">&#8377;{fmt(Number(invoice.gst_total) / 2)}</td>
                    </tr>
                    <tr>
                      <td className="label text-left text-[11px] text-gray-600 border-none px-3 py-1">SGST</td>
                      <td className="text-right text-[11px] border-none px-3 py-1">&#8377;{fmt(Number(invoice.gst_total) / 2)}</td>
                    </tr>
                    <tr className="total">
                      <td className="text-left text-sm font-bold text-green-900 border-t-2 border-green-900 border-none px-3 pt-2 py-1">Grand Total</td>
                      <td className="text-right text-sm font-bold text-green-900 border-t-2 border-green-900 border-none px-3 pt-2 py-1">&#8377;{fmt(Number(invoice.grand_total))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank details */}
            <div className="bank-section flex gap-px bg-gray-200">
              <div className="bank-box flex-1 px-4 py-3 bg-green-50">
                <div className="bank-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Bank Details</div>
                <div className="bank-detail text-[10px] text-gray-600 leading-relaxed">
                  {bankName && <div>Bank: <span className="font-semibold text-green-900">{bankName}</span></div>}
                  {accountNumber && <div>A/C: <span className="font-semibold text-green-900">{accountNumber}</span></div>}
                  {ifscCode && <div>IFSC: <span className="font-semibold text-green-900">{ifscCode}</span></div>}
                  {branch && <div>Branch: <span className="font-semibold text-green-900">{branch}</span></div>}
                  {upiId && <div>UPI: <span className="font-semibold text-green-900">{upiId}</span>{upiQr && (
  <div className="mt-4">
    <img
      src={upiQr}
      alt="UPI QR"
      className="w-28 h-28 border rounded bg-white p-2"
    />

    <p className="text-[10px] text-center mt-2 text-gray-600">
      Scan & Pay
    </p>
  </div>
)}</div>}
                  {!bankName && !accountNumber && !upiId && <div className="text-gray-400">Bank details not configured. Set them in Company Settings.</div>}
                </div>
              </div>
              <div className="bank-box flex-1 px-4 py-3 bg-green-50">
                <div className="bank-label text-[9px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Tax Summary</div>
                <div className="bank-detail text-[10px] text-gray-600 leading-relaxed">
                  <div>Taxable Amount: <span className="font-semibold text-green-900">&#8377;{fmt(Number(invoice.subtotal))}</span></div>
                  <div>CGST: <span className="font-semibold text-green-900">&#8377;{fmt(Number(invoice.gst_total) / 2)}</span></div>
                  <div>SGST: <span className="font-semibold text-green-900">&#8377;{fmt(Number(invoice.gst_total) / 2)}</span></div>
                  <div>Total Tax: <span className="font-semibold text-green-900">&#8377;{fmt(Number(invoice.gst_total))}</span></div>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="sign-section flex justify-between px-5 py-4">
              <div className="sign-left text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
                {invoice.notes && (
                  <div>
                    <div className="font-bold text-green-600 uppercase tracking-wider text-[9px] mb-1">Notes</div>
                    <div>{invoice.notes}</div>
                  </div>
                )}
                <div className="mt-3">This is a computer-generated invoice and does not require a physical signature.</div>
              </div>
              <div className="sign-right text-right">
                <div className="text-[10px] text-gray-600">For <span className="font-bold text-green-900">{companyName}</span></div>
                <div className="text-right">

    {settings?.signature_url && (
  <img
    src={settings.signature_url}
    alt="Signature"
    className="h-16 ml-auto object-contain"
  />
)}

    <div className="text-xs text-gray-600 mt-1">
        Authorised Signatory
    </div>

</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer bg-green-900 text-green-100 px-5 py-2 text-[10px] text-center">
              Thank you for your business! &middot; {companyName} &middot; {companyPhone} &middot; {companyEmail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
