/*
# Extend invoices for complete GST billing details

## Overview
Adds the document, delivery, customer, pricing, payment, and notes fields needed by the complete invoice workflow shown in the billing screens.

## Modified Tables
- `invoices`
  - document reference fields: invoice type, challan, purchase order, transport/LR, and E-Way number details
  - delivery and customer fields: delivery mode, contact person, reverse charge, ship-to address, and bank label
  - commercial fields: terms title/detail, document remarks, TCS, discount, rounding, and payment type
- `invoice_items`
  - item note, item discount, and stock quantity snapshot

## Data Safety
- Every new column is nullable or has a safe default.
- Existing invoices and invoice items remain unchanged and continue to display correctly.
- No columns or existing data are removed.

## Security
- Existing RLS policies remain unchanged.
- No new tables or access rules are introduced.

## Important Notes
1. Existing invoices use the current default values until edited.
2. The invoice form stores a snapshot of entered values so later supplier changes do not rewrite historical invoices.
*/

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'Regular';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS challan_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS challan_date date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_date date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lr_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS eway_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_mode text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reverse_charge text NOT NULL DEFAULT 'No';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_details text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_title text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_detail text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_notes text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tcs_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tcs_type text NOT NULL DEFAULT 'percentage';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'amount';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS round_off numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'Credit';

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_note text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'amount';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS stock_quantity numeric(12,2);

CREATE INDEX IF NOT EXISTS invoices_payment_type_idx ON invoices(payment_type);