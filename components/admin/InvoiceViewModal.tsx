'use client';

import { useRef, useEffect, useState } from 'react';

import {
  type Invoice,
  type InvoiceItem,
  type CompanySettings,
  type SocialLink,
  supabase,
} from '@/lib/supabase';

import {
  X,
  Printer,
} from 'lucide-react';

import Image from 'next/image';
import QRCode from 'qrcode';

type Props = {
  invoice: Invoice;
  items: InvoiceItem[];
  onClose: () => void;
};

/* =========================================================
   FORMATTERS
========================================================= */

const fmt = (n: number) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmt0 = (n: number) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function formatDate(date?: string | null) {
  if (!date) return '—';

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* =========================================================
   STATUS
========================================================= */

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

/* =========================================================
   NUMBER TO WORDS
========================================================= */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(n: number): string {
  n = Math.floor(Math.abs(n));

  if (n < 20) {
    return ones[n] || '';
  }

  return (
    tens[Math.floor(n / 10)] +
    (n % 10 ? ` ${ones[n % 10]}` : '')
  );
}

function threeDigits(n: number): string {
  n = Math.floor(Math.abs(n));

  const h = Math.floor(n / 100);
  const r = n % 100;

  let result = '';

  if (h) {
    result += `${ones[h]} Hundred`;
  }

  if (r) {
    result += `${h ? ' ' : ''}${twoDigits(r)}`;
  }

  return result;
}

function numberToWords(num: number): string {
  const value = Number(num || 0);

  const rupees = Math.floor(Math.abs(value));

  let paise = Math.round(
    (Math.abs(value) - rupees) * 100
  );

  if (paise === 100) {
    paise = 0;
  }

  if (rupees === 0 && paise === 0) {
    return 'Zero Rupees Only';
  }

  let words = '';

  const crore = Math.floor(
    rupees / 10000000
  );

  const lakh = Math.floor(
    (rupees % 10000000) / 100000
  );

  const thousand = Math.floor(
    (rupees % 100000) / 1000
  );

  const remaining = rupees % 1000;

  if (crore) {
    words += `${threeDigits(crore)} Crore `;
  }

  if (lakh) {
    words += `${twoDigits(lakh)} Lakh `;
  }

  if (thousand) {
    words += `${twoDigits(thousand)} Thousand `;
  }

  if (remaining) {
    words += threeDigits(remaining);
  }

  words = words.trim();

  if (!words) {
    words = 'Zero';
  }

  words += ' Rupees';

  if (paise > 0) {
    words += ` and ${twoDigits(paise)} Paise`;
  }

  words += ' Only';

  return words;
}

/* =========================================================
   SOCIAL PLATFORM LABEL
========================================================= */

function getSocialLabel(
  social: SocialLink
) {
  if (social.label?.trim()) {
    return social.label.trim();
  }

  switch (social.platform) {
    case 'instagram':
      return 'Instagram';

    case 'facebook':
      return 'Facebook';

    case 'youtube':
      return 'YouTube';

    case 'linkedin':
      return 'LinkedIn';

    case 'whatsapp':
      return 'WhatsApp';

    case 'website':
      return 'Website';

    default:
      return 'Follow / Visit Us';
  }
}

/* =========================================================
   SOCIAL URL VALIDATION
========================================================= */

function isValidUrl(
  value: string
) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

/* =========================================================
   INVOICE CSS
========================================================= */

const invoiceStyles = `
@page {
  size: A4 portrait;
  margin: 6mm;
}

.invoice-document,
.invoice-document * {
  box-sizing: border-box;
}

.invoice-document {
  width: 100%;
  max-width: 198mm;
  margin: 0 auto;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8px;
  line-height: 1.3;
}

.invoice-document img {
  display: block;
  max-width: 100%;
}

.invoice-border {
  border: 1px solid #0080ff;
}

/* =========================================================
   COMPANY HEADER
========================================================= */

.company-header {
  display: grid;
  grid-template-columns: 72% 28%;
  min-height: 34mm;
  border-bottom: 1px solid #0080ff;
}

.company-main {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px;
  min-width: 0;
}

.company-logo {
  width: 32mm;
  height: 24mm;
  object-fit: contain;
  flex-shrink: 0;
}

.company-information {
  min-width: 0;
  flex: 1;
}

.company-name {
  font-size: 17px;
  line-height: 1.1;
  font-weight: 800;
  font-style: italic;
  margin-bottom: 4px;
}

.company-line {
  font-size: 8px;
  line-height: 1.45;
  word-break: break-word;
}

.company-line strong {
  font-weight: 800;
}

.company-right {
  padding: 7px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  text-align: right;
}

.company-right-name {
  font-size: 15px;
  line-height: 1.1;
  font-weight: 800;
  font-style: italic;
}

/* =========================================================
   GST / TITLE
========================================================= */

.invoice-title-row {
  display: grid;
  grid-template-columns: 33% 34% 33%;
  min-height: 8mm;
  border-bottom: 1px solid #0080ff;
}

.gstin-cell {
  display: flex;
  align-items: center;
  padding: 3px 5px;
  font-size: 9px;
  font-weight: 800;
}

.tax-title {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-left: 1px solid #0080ff;
  border-right: 1px solid #0080ff;
  color: #0070c9;
  font-size: 15px;
  font-weight: 800;
}

.recipient {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 3px 5px;
  font-size: 8px;
  font-weight: 800;
}

/* =========================================================
   CUSTOMER
========================================================= */

.customer-section {
  display: grid;
  grid-template-columns: 55% 45%;
  min-height: 31mm;
  border-bottom: 1px solid #0080ff;
}

.customer-box {
  padding: 5px;
  min-width: 0;
}

.customer-box:first-child {
  border-right: 1px solid #0080ff;
}

.section-heading {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  text-decoration: underline;
  margin-bottom: 4px;
}

.customer-table {
  width: 100%;
  border-collapse: collapse;
}

.customer-table td {
  border: none !important;
  padding: 1px 2px;
  vertical-align: top;
  font-size: 8px;
  line-height: 1.35;
}

.customer-table td:first-child {
  width: 25%;
  font-weight: 700;
}

.customer-name {
  font-size: 10px !important;
  font-weight: 800 !important;
}

/* =========================================================
   ITEMS
========================================================= */

.items-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.items-table th,
.items-table td {
  border: 1px solid #0080ff;
}

.items-table thead th {
  background: #eaf5ff;
  color: #000;
  padding: 4px 2px;
  font-size: 7.5px;
  line-height: 1.15;
  text-align: center;
  vertical-align: middle;
  font-weight: 800;
}

.items-table tbody td {
  padding: 3px;
  font-size: 8px;
  height: 8mm;
  vertical-align: top;
}

.items-table .center {
  text-align: center;
}

.items-table .right {
  text-align: right;
}

.items-table .description {
  text-align: left;
  font-weight: 700;
  word-break: break-word;
}

.item-note {
  margin-top: 2px;
  font-size: 7px;
  font-weight: 400;
  color: #555;
}

/* column widths */

.col-no {
  width: 5%;
}

.col-description {
  width: 24%;
}

.col-hsn {
  width: 9%;
}

.col-unit {
  width: 7%;
}

.col-qty {
  width: 7%;
}

.col-rate {
  width: 9%;
}

.col-taxable {
  width: 11%;
}

.col-gst {
  width: 6%;
}

.col-cgst {
  width: 8%;
}

.col-sgst {
  width: 8%;
}

.col-total {
  width: 12%;
}

.item-total-row td {
  background: #f4faff;
  font-weight: 800;
  padding-top: 4px;
  padding-bottom: 4px;
}

/* =========================================================
   SUMMARY
========================================================= */

.summary-section {
  display: grid;
  grid-template-columns: 60% 40%;
  min-height: 21mm;
  border-bottom: 1px solid #0080ff;
}

.amount-words {
  padding: 6px;
  border-right: 1px solid #0080ff;
}

.amount-words-title {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.amount-words-text {
  font-size: 9px;
  font-weight: 800;
  line-height: 1.4;
  text-transform: uppercase;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table td {
  border: none !important;
  padding: 2.5px 5px;
  font-size: 8px;
}

.summary-table td:first-child {
  font-weight: 600;
}

.summary-table td:last-child {
  text-align: right;
  font-weight: 700;
}

.summary-grand td {
  border-top: 1px solid #0080ff !important;
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  font-size: 10px !important;
  font-weight: 800 !important;
}

/* =========================================================
   BANK + TAX
========================================================= */

.bottom-section {
  display: grid;
  grid-template-columns: 60% 40%;
  min-height: 32mm;
  border-bottom: 1px solid #0080ff;
}

.bank-section {
  padding: 5px;
  border-right: 1px solid #0080ff;
}

.tax-section {
  padding: 5px;
}

.bank-heading,
.tax-heading {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.bank-content {
  display: grid;
  grid-template-columns: 62% 38%;
  min-height: 26mm;
}

.bank-info {
  font-size: 8px;
  line-height: 1.55;
  min-width: 0;
}

.bank-info-row {
  display: grid;
  grid-template-columns: 28% 72%;
}

.bank-info-label {
  font-weight: 800;
}

.bank-info-value {
  font-weight: 600;
  word-break: break-word;
}

.invoice-bank-detail {
  margin-bottom: 4px;
  font-size: 7.5px;
  line-height: 1.35;
}

.qr-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-area img {
  width: 26mm;
  height: 26mm;
  object-fit: contain;
  border: 1px solid #ddd;
  padding: 2px;
  background: #fff;
}

.qr-text {
  margin-top: 2px;
  font-size: 7px;
  font-weight: 800;
}

/* =========================================================
   SOCIAL MEDIA QR
========================================================= */

.social-section {
  border-bottom: 1px solid #0080ff;
  padding: 5px;
}

.social-heading {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.social-grid {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.social-card {
  width: 29mm;
  min-height: 31mm;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.social-card img {
  width: 21mm;
  height: 21mm;
  object-fit: contain;
  border: 1px solid #ddd;
  padding: 1px;
  background: #fff;
}

.social-card-title {
  margin-top: 2px;
  font-size: 7px;
  line-height: 1.2;
  font-weight: 800;
  word-break: break-word;
}

.social-card-url {
  margin-top: 1px;
  font-size: 5.5px;
  line-height: 1.1;
  color: #555;
  max-width: 29mm;
  word-break: break-all;
}

/* =========================================================
   TERMS + SIGNATURE
========================================================= */

.final-section {
  display: grid;
  grid-template-columns: 60% 40%;
  min-height: 35mm;
  border-bottom: 1px solid #0080ff;
}

.terms-section {
  padding: 5px;
  border-right: 1px solid #0080ff;
}

.terms-heading {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 3px;
}

.terms-content {
  font-size: 7.5px;
  line-height: 1.45;
}

.term-line {
  margin-bottom: 2px;
}

.signature-section {
  padding: 5px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.for-company {
  font-size: 8px;
  font-weight: 800;
}

.signature-image {
  width: 42mm;
  height: 16mm;
  object-fit: contain;
  margin: 1px auto;
}

.signature-placeholder {
  width: 42mm;
  height: 16mm;
}

.authorised {
  width: 100%;
  border-top: 1px solid #0080ff;
  padding-top: 3px;
  margin-top: 2px;
  font-size: 7.5px;
  font-weight: 800;
}

/* =========================================================
   FOOTER
========================================================= */

.invoice-footer {
  padding: 4px;
  text-align: center;
  font-size: 7.5px;
  font-weight: 700;
}

/* =========================================================
   PREVIEW
========================================================= */

.invoice-preview-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #f3f4f6;
  padding: 20px;
}

@media screen {
  .invoice-document {
    box-shadow: 0 2px 12px rgba(0,0,0,.08);
  }
}

/* =========================================================
   PRINT
========================================================= */

@media print {

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .invoice-document {
    width: 198mm;
    max-width: 198mm;
    margin: 0 auto;
  }

  .invoice-border {
    border: 1px solid #0080ff;
  }

  table,
  tr,
  td,
  th,
  .company-header,
  .customer-section,
  .summary-section,
  .bottom-section,
  .social-section,
  .final-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;

/* =========================================================
   COMPONENT
========================================================= */

export default function InvoiceViewModal({
  invoice,
  items,
  onClose,
}: Props) {
  const invoiceRef =
    useRef<HTMLDivElement>(null);

  const [settings, setSettings] =
    useState<CompanySettings | null>(
      null
    );

  const [socialLinks, setSocialLinks] =
    useState<SocialLink[]>([]);

  const [socialQrs, setSocialQrs] =
    useState<
      Record<string, string>
    >({});

  const [upiQr, setUpiQr] =
    useState('');

  /* =========================================================
     LOAD COMPANY SETTINGS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadCompany =
      async () => {
        try {
          /* ---------------------------------------------
             COMPANY SETTINGS
          --------------------------------------------- */

          const {
            data,
            error,
          } = await supabase
            .from(
              'company_settings'
            )
            .select('*')
            .single();

          if (error) {
            console.error(
              'Company Settings Error:',
              error
            );

            return;
          }

          if (
            cancelled ||
            !data
          ) {
            return;
          }

          /* ---------------------------------------------
             NORMALIZE ARRAYS
          --------------------------------------------- */

          const companySettings:
            CompanySettings = {
            ...data,

            phone_numbers:
              Array.isArray(
                data.phone_numbers
              )
                ? data.phone_numbers
                : [],

            emails:
              Array.isArray(
                data.emails
              )
                ? data.emails
                : [],
          };

          setSettings(
            companySettings
          );

          /* ---------------------------------------------
             UPI QR
          --------------------------------------------- */

          if (
            data.upi_id &&
            isValidUrl(
              'https://example.com'
            )
          ) {
            try {
              const upiPayload =
                `upi://pay?pa=${encodeURIComponent(
                  data.upi_id
                )}` +
                `&pn=${encodeURIComponent(
                  data.company_name ||
                    ''
                )}` +
                `&am=${Number(
                  invoice.grand_total ||
                    0
                ).toFixed(2)}` +
                `&cu=INR`;

              const qr =
                await QRCode.toDataURL(
                  upiPayload,
                  {
                    margin: 1,
                    width: 300,
                    errorCorrectionLevel:
                      'M',
                  }
                );

              if (
                !cancelled
              ) {
                setUpiQr(qr);
              }
            } catch (error) {
              console.error(
                'UPI QR Generation Error:',
                error
              );

              if (
                !cancelled
              ) {
                setUpiQr('');
              }
            }
          } else {
            /*
             * UPI IDs don't need URL validation.
             * Generate QR whenever a UPI ID exists.
             */

            if (data.upi_id) {
              try {
                const upiPayload =
                  `upi://pay?pa=${encodeURIComponent(
                    data.upi_id
                  )}` +
                  `&pn=${encodeURIComponent(
                    data.company_name ||
                      ''
                  )}` +
                  `&am=${Number(
                    invoice.grand_total ||
                      0
                  ).toFixed(2)}` +
                  `&cu=INR`;

                const qr =
                  await QRCode.toDataURL(
                    upiPayload,
                    {
                      margin: 1,
                      width: 300,
                      errorCorrectionLevel:
                        'M',
                    }
                  );

                if (
                  !cancelled
                ) {
                  setUpiQr(qr);
                }
              } catch (error) {
                console.error(
                  'UPI QR Generation Error:',
                  error
                );
              }
            } else {
              setUpiQr('');
            }
          }

          /* ---------------------------------------------
             SOCIAL LINKS
          --------------------------------------------- */

          const {
            data: socialData,
            error: socialError,
          } = await supabase
            .from('social_links')
            .select('*')
            .eq(
              'company_id',
              data.id
            )
            .eq(
              'is_active',
              true
            )
            .order(
              'display_order',
              {
                ascending: true,
              }
            );

          if (
            socialError
          ) {
            console.error(
              'Social Links Error:',
              socialError
            );

            if (
              !cancelled
            ) {
              setSocialLinks(
                []
              );
              setSocialQrs({});
            }

            return;
          }

          const activeSocialLinks =
            (
              socialData ||
              []
            ).filter(
              (
                social
              ) =>
                social.url &&
                isValidUrl(
                  social.url
                )
            ) as SocialLink[];

          if (
            cancelled
          ) {
            return;
          }

          setSocialLinks(
            activeSocialLinks
          );

          /* ---------------------------------------------
             GENERATE SOCIAL QR CODES
          --------------------------------------------- */

          const qrEntries: Record<
            string,
            string
          > = {};

          for (
            const social of activeSocialLinks
          ) {
            try {
              const qr =
                await QRCode.toDataURL(
                  social.url,
                  {
                    margin: 1,
                    width: 250,
                    errorCorrectionLevel:
                      'M',
                  }
                );

              qrEntries[
                social.id
              ] = qr;
            } catch (error) {
              console.error(
                `Social QR Error for ${social.platform}:`,
                error
              );
            }
          }

          if (
            !cancelled
          ) {
            setSocialQrs(
              qrEntries
            );
          }
        } catch (error) {
          console.error(
            'Invoice Company Load Error:',
            error
          );
        }
      };

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [
    invoice.grand_total,
  ]);

  /* =========================================================
     COMPANY DATA

     IMPORTANT:
     Company address comes ONLY from company_settings.address.
  ========================================================= */

  const companyName =
    settings?.company_name ||
    'B M N ENTERPRISES';

  const companyAddress =
    settings?.address || '';

  /* =========================================================
     MULTIPLE PHONE NUMBERS
  ========================================================= */

  const companyPhones =
    Array.isArray(
      settings?.phone_numbers
    )
      ? settings.phone_numbers
          .map(
            (phone) =>
              phone?.trim()
          )
          .filter(Boolean)
      : [];

  /* =========================================================
     MULTIPLE EMAILS
  ========================================================= */

  const companyEmails =
    Array.isArray(
      settings?.emails
    )
      ? settings.emails
          .map(
            (email) =>
              email?.trim()
          )
          .filter(Boolean)
      : [];

  const companyGstin =
    settings?.gstin || '';

  const companyPan =
    settings?.pan || '';

  const bankName =
    settings?.bank_name || '';

  const accountNumber =
    settings?.account_number ||
    '';

  const ifscCode =
    settings?.ifsc_code || '';

  const branch =
    settings?.branch || '';

  const upiId =
    settings?.upi_id || '';

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const subtotal =
    Number(invoice.subtotal) ||
    0;

  const gstTotal =
    Number(invoice.gst_total) ||
    0;

  const cgstTotal =
    gstTotal / 2;

  const sgstTotal =
    gstTotal / 2;

  const discountValue =
    Number(
      invoice.discount_value
    ) || 0;

  const tcsValue =
    Number(invoice.tcs_value) ||
    0;

  const tcsAmount =
    invoice.tcs_type ===
    'percentage'
      ? (subtotal * tcsValue) / 100
      : tcsValue;

  const roundOff =
    Number(invoice.round_off) ||
    0;

  const grandTotal =
    Number(invoice.grand_total) ||
    0;

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    if (
      !invoiceRef.current
    ) {
      return;
    }

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=1100,height=900'
      );

    if (!printWindow) {
      alert(
        'Please allow popups to print the invoice.'
      );

      return;
    }

    const invoiceHtml =
      invoiceRef.current
        .innerHTML;

    printWindow.document.open();

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
Tax Invoice ${invoice.invoice_number}
</title>

<style>

${invoiceStyles}

html,
body {
  width: 210mm;
  min-height: 297mm;
}

</style>

</head>

<body>

${invoiceHtml}

</body>

</html>
`);

    printWindow.document.close();

    const printInvoice =
      () => {
        setTimeout(() => {
          printWindow.focus();

          printWindow.print();

          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 300);
      };

    /* ---------------------------------------------
       WAIT FOR IMAGES
    --------------------------------------------- */

    const waitForImages =
      () => {
        const images =
          Array.from(
            printWindow
              .document
              .images
          );

        if (
          images.length ===
          0
        ) {
          printInvoice();

          return;
        }

        let completed = 0;

        const done = () => {
          completed++;

          if (
            completed >=
            images.length
          ) {
            printInvoice();
          }
        };

        images.forEach(
          (img) => {
            if (
              img.complete
            ) {
              done();
            } else {
              img.onload =
                done;

              img.onerror =
                done;
            }
          }
        );
      };

    if (
      printWindow.document
        .readyState ===
      'complete'
    ) {
      waitForImages();
    } else {
      printWindow.onload =
        waitForImages;
    }
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* =================================================
            MODAL HEADER
        ================================================= */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">

          <h3 className="font-display text-xl font-bold text-green-900">
            Tax Invoice{' '}
            {invoice.invoice_number}
          </h3>

          <div className="flex items-center gap-2">

            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[
                  invoice.status
                ] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {invoice.status
                ? invoice.status
                    .charAt(0)
                    .toUpperCase() +
                  invoice.status.slice(
                    1
                  )
                : 'Draft'}
            </span>

            <button
              onClick={
                handlePrint
              }
              className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >

              <Printer className="w-4 h-4" />

              Print / PDF

            </button>

            <button
              onClick={
                onClose
              }
              className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
              aria-label="Close"
            >

              <X className="w-5 h-5 text-green-500" />

            </button>

          </div>

        </div>

        {/* =================================================
            INVOICE PREVIEW
        ================================================= */}

        <div className="overflow-y-auto flex-1">

          <div
            ref={
              invoiceRef
            }
            className="invoice-preview-wrapper"
          >

            <style>
              {
                invoiceStyles
              }
            </style>

            <div className="invoice-document invoice-border">

              {/* =================================================
                  COMPANY HEADER
              ================================================= */}

              <div className="company-header">

                {/* LEFT */}

                <div className="company-main">

                  <Image
                    src={
                      settings?.logo_url ||
                      '/bmn_logo.jpeg'
                    }
                    alt={
                      companyName
                    }
                    width={150}
                    height={100}
                    className="company-logo"
                    unoptimized
                  />

                  <div className="company-information">

                    <div className="company-name">
                      {
                        companyName
                      }
                    </div>

                    {/* =========================================
                        MULTIPLE PHONE NUMBERS
                    ========================================= */}

                    {companyPhones.length >
                      0 && (
                      <div className="company-line">

                        <strong>
                          Mobile:
                        </strong>{' '}

                        {
                          companyPhones.join(
                            ' | '
                          )
                        }

                      </div>
                    )}

                    {/* =========================================
                        MULTIPLE EMAILS
                    ========================================= */}

                    {companyEmails.length >
                      0 && (
                      <div className="company-line">

                        <strong>
                          Email ID:
                        </strong>{' '}

                        {
                          companyEmails.join(
                            ' | '
                          )
                        }

                      </div>
                    )}

                    {/* =========================================
                        COMPANY ADDRESS

                        ONLY ONE ADDRESS.
                    ========================================= */}

                    {companyAddress && (
                      <div className="company-line">

                        <strong>
                          Address:
                        </strong>{' '}

                        {
                          companyAddress
                        }

                      </div>
                    )}

                    {/* PAN */}

                    {companyPan && (
                      <div className="company-line">

                        <strong>
                          PAN:
                        </strong>{' '}

                        {
                          companyPan
                        }

                      </div>
                    )}

                  </div>

                </div>

                {/* RIGHT

                    COMPANY NAME ONLY.
                    No address.
                    No phone.
                    No email.
                */}

                <div className="company-right">

                  <div className="company-right-name">
                    {
                      companyName
                    }
                  </div>

                </div>

              </div>

              {/* =================================================
                  GST / TITLE
              ================================================= */}

              <div className="invoice-title-row">

                <div className="gstin-cell">

                  GSTIN:{' '}

                  {
                    companyGstin ||
                    '—'
                  }

                </div>

                <div className="tax-title">
                  TAX INVOICE
                </div>

                <div className="recipient">
                  ORIGINAL FOR RECIPIENT
                </div>

              </div>

              {/* =================================================
                  CUSTOMER + INVOICE DETAILS
              ================================================= */}

              <div className="customer-section">

                {/* CUSTOMER */}

                <div className="customer-box">

                  <div className="section-heading">
                    Customer Details
                  </div>

                  <table className="customer-table">

                    <tbody>

                      <tr>

                        <td>
                          M/S
                        </td>

                        <td className="customer-name">

                          {
                            invoice.customer_name ||
                            '—'
                          }

                        </td>

                      </tr>

                      {invoice.contact_person && (
                        <tr>

                          <td>
                            Contact
                          </td>

                          <td>
                            {
                              invoice.contact_person
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.customer_address && (
                        <tr>

                          <td>
                            Address
                          </td>

                          <td>
                            {
                              invoice.customer_address
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.customer_phone && (
                        <tr>

                          <td>
                            Phone
                          </td>

                          <td>
                            {
                              invoice.customer_phone
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.customer_email && (
                        <tr>

                          <td>
                            Email
                          </td>

                          <td>
                            {
                              invoice.customer_email
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.customer_gst && (
                        <tr>

                          <td>
                            GSTIN
                          </td>

                          <td>

                            <strong>
                              {
                                invoice.customer_gst
                              }
                            </strong>

                          </td>

                        </tr>
                      )}

                      {invoice.customer_pan && (
                        <tr>

                          <td>
                            PAN
                          </td>

                          <td>

                            <strong>
                              {
                                invoice.customer_pan
                              }
                            </strong>

                          </td>

                        </tr>
                      )}

                      <tr>

                        <td>
                          Place of Supply
                        </td>

                        <td>

                          {
                            invoice.place_of_supply ||
                            '—'
                          }

                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

                {/* INVOICE DETAILS */}

                <div className="customer-box">

                  <div className="section-heading">
                    Invoice Details
                  </div>

                  <table className="customer-table">

                    <tbody>

                      <tr>

                        <td>
                          Invoice No.
                        </td>

                        <td>

                          <strong>
                            {
                              invoice.invoice_number
                            }
                          </strong>

                        </td>

                      </tr>

                      <tr>

                        <td>
                          Invoice Date
                        </td>

                        <td>
                          {formatDate(
                            invoice.invoice_date
                          )}
                        </td>

                      </tr>

                      {invoice.due_date && (
                        <tr>

                          <td>
                            Due Date
                          </td>

                          <td>
                            {formatDate(
                              invoice.due_date
                            )}
                          </td>

                        </tr>
                      )}

                      <tr>

                        <td>
                          Payment Type
                        </td>

                        <td>
                          {
                            invoice.payment_type ||
                            'Credit'
                          }
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Reverse Charge
                        </td>

                        <td>
                          {
                            invoice.reverse_charge ||
                            'No'
                          }
                        </td>

                      </tr>

                      {invoice.delivery_mode && (
                        <tr>

                          <td>
                            Delivery
                          </td>

                          <td>
                            {
                              invoice.delivery_mode
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.challan_no && (
                        <tr>

                          <td>
                            Challan No.
                          </td>

                          <td>

                            {
                              invoice.challan_no
                            }

                            {invoice.challan_date &&
                              ` · ${formatDate(
                                invoice.challan_date
                              )}`}

                          </td>

                        </tr>
                      )}

                      {invoice.po_no && (
                        <tr>

                          <td>
                            PO No.
                          </td>

                          <td>

                            {
                              invoice.po_no
                            }

                            {invoice.po_date &&
                              ` · ${formatDate(
                                invoice.po_date
                              )}`}

                          </td>

                        </tr>
                      )}

                      {invoice.lr_no && (
                        <tr>

                          <td>
                            LR / Transport
                          </td>

                          <td>
                            {
                              invoice.lr_no
                            }
                          </td>

                        </tr>
                      )}

                      {invoice.eway_no && (
                        <tr>

                          <td>
                            E-Way Bill
                          </td>

                          <td>
                            {
                              invoice.eway_no
                            }
                          </td>

                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* =================================================
                  ITEMS
              ================================================= */}

              <table className="items-table">

                <colgroup>

                  <col className="col-no" />
                  <col className="col-description" />
                  <col className="col-hsn" />
                  <col className="col-unit" />
                  <col className="col-qty" />
                  <col className="col-rate" />
                  <col className="col-taxable" />
                  <col className="col-gst" />
                  <col className="col-cgst" />
                  <col className="col-sgst" />
                  <col className="col-total" />

                </colgroup>

                <thead>

                  <tr>

                    <th>
                      Sr.
                      <br />
                      No.
                    </th>

                    <th>
                      Name of Product / Service
                    </th>

                    <th>
                      HSN / SAC
                    </th>

                    <th>
                      Unit
                    </th>

                    <th>
                      Qty
                    </th>

                    <th>
                      Rate
                    </th>

                    <th>
                      Taxable Value
                    </th>

                    <th>
                      GST
                      <br />
                      %
                    </th>

                    <th>
                      CGST
                      <br />
                      Amount
                    </th>

                    <th>
                      SGST
                      <br />
                      Amount
                    </th>

                    <th>
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {items.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={
                          11
                        }
                        className="center"
                        style={{
                          height:
                            '20mm',
                        }}
                      >
                        No invoice items
                      </td>

                    </tr>

                  ) : (

                    items.map(
                      (
                        it,
                        idx
                      ) => {

                        const base =
                          Number(
                            it.base_amount
                          ) || 0;

                        const gst =
                          Number(
                            it.gst_amount
                          ) || 0;

                        const total =
                          Number(
                            it.total
                          ) || 0;

                        const cgst =
                          gst / 2;

                        const sgst =
                          gst / 2;

                        return (
                          <tr
                            key={
                              it.id ||
                              `${idx}-${it.description}`
                            }
                          >

                            <td className="center">
                              {
                                idx +
                                1
                              }
                            </td>

                            <td className="description">

                              {
                                it.description
                              }

                              {it.item_note && (
                                <div className="item-note">
                                  {
                                    it.item_note
                                  }
                                </div>
                              )}

                            </td>

                            <td className="center">
                              {
                                it.hsn_sac_code ||
                                '—'
                              }
                            </td>

                            <td className="center">
                              {
                                it.unit ||
                                'NOS'
                              }
                            </td>

                            <td className="center">
                              {fmt0(
                                Number(
                                  it.quantity
                                )
                              )}
                            </td>

                            <td className="right">
                              {fmt(
                                Number(
                                  it.unit_price
                                )
                              )}
                            </td>

                            <td className="right">
                              {fmt(
                                base
                              )}
                            </td>

                            <td className="center">
                              {
                                Number(
                                  it.gst_percentage
                                ) ||
                                0
                              }
                              %
                            </td>

                            <td className="right">
                              {fmt(
                                cgst
                              )}
                            </td>

                            <td className="right">
                              {fmt(
                                sgst
                              )}
                            </td>

                            <td className="right">

                              <strong>
                                {fmt(
                                  total
                                )}
                              </strong>

                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                  {/* TOTAL */}

                  <tr className="item-total-row">

                    <td
                      colSpan={
                        5
                      }
                      className="right"
                    >
                      Total
                    </td>

                    <td />

                    <td className="right">
                      {fmt(
                        subtotal
                      )}
                    </td>

                    <td />

                    <td className="right">
                      {fmt(
                        cgstTotal
                      )}
                    </td>

                    <td className="right">
                      {fmt(
                        sgstTotal
                      )}
                    </td>

                    <td className="right">
                      {fmt(
                        grandTotal
                      )}
                    </td>

                  </tr>

                </tbody>

              </table>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="summary-section">

                <div className="amount-words">

                  <div className="amount-words-title">
                    Total in Words
                  </div>

                  <div className="amount-words-text">
                    {numberToWords(
                      grandTotal
                    )}
                  </div>

                </div>

                <div>

                  <table className="summary-table">

                    <tbody>

                      <tr>

                        <td>
                          Taxable Amount
                        </td>

                        <td>
                          ₹
                          {fmt(
                            subtotal
                          )}
                        </td>

                      </tr>

                      {discountValue >
                        0 && (
                        <tr>

                          <td>

                            Discount

                            {invoice.discount_type ===
                              'percentage' &&
                              ` (${invoice.discount_value}%)`}

                          </td>

                          <td>
                            - ₹
                            {fmt(
                              discountValue
                            )}
                          </td>

                        </tr>
                      )}

                      <tr>

                        <td>
                          Add : CGST
                        </td>

                        <td>
                          ₹
                          {fmt(
                            cgstTotal
                          )}
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Add : SGST
                        </td>

                        <td>
                          ₹
                          {fmt(
                            sgstTotal
                          )}
                        </td>

                      </tr>

                      {tcsValue >
                        0 && (
                        <tr>

                          <td>

                            TCS

                            {invoice.tcs_type ===
                              'percentage' &&
                              ` (${invoice.tcs_value}%)`}

                          </td>

                          <td>
                            ₹
                            {fmt(
                              tcsAmount
                            )}
                          </td>

                        </tr>
                      )}

                      {roundOff !==
                        0 && (
                        <tr>

                          <td>
                            Round Off
                          </td>

                          <td>
                            ₹
                            {fmt(
                              roundOff
                            )}
                          </td>

                        </tr>
                      )}

                      <tr className="summary-grand">

                        <td>
                          Total Amount After Tax
                        </td>

                        <td>
                          ₹
                          {fmt(
                            grandTotal
                          )}
                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>

              {/* =================================================
                  BANK + TAX
              ================================================= */}

              <div className="bottom-section">

                {/* BANK */}

                <div className="bank-section">

                  <div className="bank-heading">
                    Bank Details
                  </div>

                  <div className="bank-content">

                    <div className="bank-info">

                      {invoice.bank_details && (
                        <div className="invoice-bank-detail">

                          <strong>
                            Invoice Bank Details:
                          </strong>{' '}

                          {
                            invoice.bank_details
                          }

                        </div>
                      )}

                      {bankName && (
                        <div className="bank-info-row">

                          <span className="bank-info-label">
                            Name
                          </span>

                          <span className="bank-info-value">
                            {
                              bankName
                            }
                          </span>

                        </div>
                      )}

                      {branch && (
                        <div className="bank-info-row">

                          <span className="bank-info-label">
                            Branch
                          </span>

                          <span className="bank-info-value">
                            {
                              branch
                            }
                          </span>

                        </div>
                      )}

                      {accountNumber && (
                        <div className="bank-info-row">

                          <span className="bank-info-label">
                            A/C Number
                          </span>

                          <span className="bank-info-value">
                            {
                              accountNumber
                            }
                          </span>

                        </div>
                      )}

                      {ifscCode && (
                        <div className="bank-info-row">

                          <span className="bank-info-label">
                            IFSC
                          </span>

                          <span className="bank-info-value">
                            {
                              ifscCode
                            }
                          </span>

                        </div>
                      )}

                      {upiId && (
                        <div className="bank-info-row">

                          <span className="bank-info-label">
                            UPI ID
                          </span>

                          <span className="bank-info-value">
                            {
                              upiId
                            }
                          </span>

                        </div>
                      )}

                      {!bankName &&
                        !accountNumber &&
                        !ifscCode &&
                        !upiId && (
                          <div>
                            Bank details not configured.
                          </div>
                        )}

                    </div>

                    {/* UPI QR */}

                    {upiQr && (
                      <div className="qr-area">

                        <img
                          src={
                            upiQr
                          }
                          alt="UPI QR Code"
                        />

                        <div className="qr-text">
                          Scan & Pay
                        </div>

                      </div>
                    )}

                  </div>

                </div>

                {/* TAX SUMMARY */}

                <div className="tax-section">

                  <div className="tax-heading">
                    Tax Summary
                  </div>

                  <table className="tax-table">

                    <tbody>

                      <tr>

                        <td>
                          Taxable Amount
                        </td>

                        <td>
                          ₹
                          {fmt(
                            subtotal
                          )}
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Add : CGST
                        </td>

                        <td>
                          ₹
                          {fmt(
                            cgstTotal
                          )}
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Add : SGST
                        </td>

                        <td>
                          ₹
                          {fmt(
                            sgstTotal
                          )}
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Total Tax
                        </td>

                        <td>
                          ₹
                          {fmt(
                            gstTotal
                          )}
                        </td>

                      </tr>

                      <tr>

                        <td>
                          Total Invoice Value
                        </td>

                        <td>
                          ₹
                          {fmt(
                            grandTotal
                          )}
                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>

              {/* =================================================
                  SOCIAL MEDIA QR CODES
              ================================================= */}

              {socialLinks.length >
                0 &&
                Object.keys(
                  socialQrs
                ).length >
                  0 && (

                  <div className="social-section">

                    <div className="social-heading">
                      Connect With Us
                    </div>

                    <div className="social-grid">

                      {socialLinks.map(
                        (
                          social
                        ) => {

                          const qr =
                            socialQrs[
                              social.id
                            ];

                          if (
                            !qr
                          ) {
                            return null;
                          }

                          return (
                            <div
                              key={
                                social.id
                              }
                              className="social-card"
                            >

                              <img
                                src={
                                  qr
                                }
                                alt={`${getSocialLabel(
                                  social
                                )} QR Code`}
                              />

                              <div className="social-card-title">
                                {
                                  getSocialLabel(
                                    social
                                  )
                                }
                              </div>

                              <div className="social-card-url">
                                {
                                  social.url
                                }
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              {/* =================================================
                  TERMS + SIGNATURE
              ================================================= */}

              <div className="final-section">

                {/* TERMS */}

                <div className="terms-section">

                  <div className="terms-heading">
                    Terms & Conditions
                  </div>

                  <div className="terms-content">

                    {invoice.notes && (
                      <div className="term-line">

                        <strong>
                          Notes:
                        </strong>{' '}

                        {
                          invoice.notes
                        }

                      </div>
                    )}

                    {invoice.terms_title && (
                      <div className="term-line">

                        <strong>
                          {
                            invoice.terms_title
                          }
                          :
                        </strong>{' '}

                        {
                          invoice.terms_detail
                        }

                      </div>
                    )}

                    {invoice.ship_to && (
                      <div className="term-line">

                        <strong>
                          Ship To:
                        </strong>{' '}

                        {
                          invoice.ship_to
                        }

                      </div>
                    )}

                    <div className="term-line">
                      Subject to our home jurisdiction.
                    </div>

                    <div className="term-line">
                      Our responsibility ceases as soon as goods leave our premises.
                    </div>

                    <div className="term-line">
                      Goods once sold will not be taken back.
                    </div>

                    <div className="term-line">
                      Delivery Ex-Premises.
                    </div>

                    <div className="term-line">
                      This is a computer-generated invoice.
                    </div>

                  </div>

                </div>

                {/* SIGNATURE */}

                <div className="signature-section">

                  <div className="for-company">
                    For {companyName}
                  </div>

                  {settings?.signature_url ? (

                    <img
                      src={
                        settings.signature_url
                      }
                      alt="Authorised Signature"
                      className="signature-image"
                    />

                  ) : (

                    <div className="signature-placeholder" />

                  )}

                  <div className="authorised">
                    Authorised Signatory
                  </div>

                </div>

              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="invoice-footer">

                Certified that the particulars given above are true and correct.

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}