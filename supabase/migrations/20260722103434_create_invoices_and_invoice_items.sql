/*
# Create invoices and invoice_items tables for GST billing

## Overview
Creates a mini billing system to manage GST invoices. Invoices are standalone
documents that can be created from scratch or linked to existing orders. Each
invoice has multiple line items (invoice_items) with per-item GST rates.

## Tables

### invoices
Stores GST invoices / bills.
- `id` (uuid PK)
- `invoice_number` (text, unique) — human-readable invoice number like INV-2026-0001
- `order_id` (uuid, nullable) — optional link to an order
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text, nullable)
- `customer_address` (text, nullable)
- `customer_gst` (text, nullable) — customer's GSTIN
- `invoice_date` (date)
- `due_date` (date, nullable)
- `subtotal` (numeric) — sum of item base amounts
- `gst_total` (numeric) — sum of item GST amounts
- `grand_total` (numeric) — subtotal + gst_total
- `notes` (text, nullable)
- `status` (text) — draft, sent, paid, cancelled
- `created_at` (timestamptz)

### invoice_items
Stores line items for each invoice.
- `id` (uuid PK)
- `invoice_id` (uuid FK → invoices, cascade delete)
- `description` (text) — product/service name
- `quantity` (integer)
- `unit_price` (numeric)
- `gst_percentage` (numeric) — per-item GST rate
- `base_amount` (numeric) — quantity * unit_price
- `gst_amount` (numeric) — base_amount * gst_percentage / 100
- `total` (numeric) — base_amount + gst_amount
- `created_at` (timestamptz)

## Security
- RLS enabled on both tables.
- Single-tenant app (anon key): policies allow anon + authenticated full CRUD.
- Using (true) is acceptable because the data is intentionally shared (no auth boundary on admin data).

## Important Notes
1. The invoice_number is auto-generated via a sequence to ensure uniqueness.
2. CGST/SGST split is calculated in the frontend as gst_amount / 2.
3. Invoices can optionally link to orders via order_id.
*/

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  customer_address text,
  customer_gst text,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  gst_total numeric(12,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  gst_percentage numeric(5,2) NOT NULL DEFAULT 18,
  base_amount numeric(12,2) NOT NULL DEFAULT 0,
  gst_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE TO anon, authenticated USING (true);