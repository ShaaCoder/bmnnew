/*
# Extend purchase orders for complete purchase billing

## Overview
Adds the vendor, purchase invoice, delivery, pricing, payment, and notes fields required by the complete purchase order workflow.

## Modified Tables
- `purchase_orders`
  - vendor snapshot fields: address, contact person, phone, GSTIN/PAN, place of supply, reverse charge, and ship-to
  - purchase invoice fields: invoice type, invoice number/date, challan number/date, LR number, E-Way number, and delivery mode
  - commercial fields: due date, terms, document notes, TCS, discount, rounding, payment type, and product-price update preference
- `purchase_order_items`
  - barcode, UOM, item note, discount, and stock quantity fields

## Data Safety
- All new fields are nullable or use safe defaults.
- Existing purchase orders and items are preserved.
- No existing columns are removed or renamed.

## Security
- Existing single-tenant RLS policies remain unchanged.
- No new tables or access rules are introduced.

## Important Notes
1. Selecting a supplier in the form fills these fields, but the values are also saved as a snapshot on the purchase order.
2. Existing records continue to display and can be edited with their current values.
*/

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'Regular';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_address text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_contact_person text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_phone text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_gstin_pan text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reverse_charge text NOT NULL DEFAULT 'No';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS place_of_supply text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS challan_no text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS challan_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS lr_no text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS eway_no text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_mode text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_title text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_detail text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS document_notes text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tcs_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tcs_type text NOT NULL DEFAULT 'percentage';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'amount';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS round_off numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'Credit';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS update_product_price boolean NOT NULL DEFAULT false;

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS barcode_no text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS uom text NOT NULL DEFAULT 'NOS';
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS item_note text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'amount';
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS stock_quantity numeric(12,2);

CREATE INDEX IF NOT EXISTS purchase_orders_invoice_no_idx ON purchase_orders(invoice_no);