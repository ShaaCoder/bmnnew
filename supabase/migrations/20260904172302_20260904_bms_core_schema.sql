/*
# Central Business Management System — Core Schema

## Overview
Extends Bharat Advance from a simple ecommerce site into a full business management
system. The ecommerce website remains one sales channel; offline sales are another.
Everything (purchasing, suppliers, central stock, online sales, offline sales, expenses,
payments, receivables/payables, profit/loss, analytics) flows through a unified schema.

## New Tables

### 1. suppliers
- id, name, contact_person, phone, email, address, gstin, pan, payment_terms, notes, created_at

### 2. purchase_orders
- id, po_number (auto), supplier_id, order_date, expected_date, status (draft/received/cancelled),
  subtotal, gst_total, grand_total, notes, created_at
- Linked to supplier via FK.

### 3. purchase_order_items
- id, purchase_order_id, product_id, description, quantity, unit_price, gst_percentage,
  hsn_sac_code, base_amount, gst_amount, total, created_at
- Linked to purchase_order and product via FKs.

### 4. stock_movements
- id, product_id, movement_type (purchase/sale/adjustment/return/transfer),
  quantity (positive=in, negative=out), reference_type, reference_id, notes, created_at
- Each movement records why stock changed and links back to the source document.

### 5. offline_sales
- id, invoice_number, customer_name, customer_phone, customer_email, customer_address,
  customer_gst, subtotal, gst_total, grand_total, payment_status (unpaid/partial/paid),
  amount_paid, sale_date, notes, created_at
- Offline sales are entered manually by the admin (walk-in customers, phone orders, etc.)

### 6. offline_sale_items
- id, offline_sale_id, product_id, description, quantity, unit_price, gst_percentage,
  base_amount, gst_amount, total, created_at

### 7. expenses
- id, category (rent/salaries/utilities/marketing/purchasing/logistics/maintenance/other),
  description, amount, gst_amount, total_amount, payment_mode (cash/upi/bank/cheque/card),
  paid_to, expense_date, receipt_url, notes, created_at

### 8. payments
- id, payment_type (receivable/payable), party_name, reference_type, reference_id,
  amount, payment_mode, payment_date, transaction_id, notes, created_at
- Tracks money received (receivables) and money paid (payables).

## Security
- RLS enabled on every table.
- Single-tenant, no customer login: anon + authenticated full CRUD on all tables.
  The admin panel (behind admin auth) manages all data; the storefront only reads
  products/categories/reviews.

## Important Notes
- Purchase orders auto-increment stock when status → 'received' (handled in the UI layer).
- Offline sales auto-decrement stock when created (handled in the UI layer).
- The `stock_movements` table is the audit trail for every stock change.
- `po_number` is generated as PO-YYYY-NNNN via a sequence.
*/

-- ============================================================
-- 1. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  contact_person text,
  phone         text,
  email         text,
  address       text,
  gstin         text,
  pan           text,
  payment_terms text,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number     text        UNIQUE NOT NULL DEFAULT '',
  supplier_id   uuid        REFERENCES suppliers(id) ON DELETE SET NULL,
  order_date    date        NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','received','cancelled')),
  subtotal      numeric(12,2) NOT NULL DEFAULT 0,
  gst_total     numeric(12,2) NOT NULL DEFAULT 0,
  grand_total   numeric(12,2) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_select_purchase_orders" ON purchase_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_insert_purchase_orders" ON purchase_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_update_purchase_orders" ON purchase_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_delete_purchase_orders" ON purchase_orders FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id  uuid        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id         uuid        REFERENCES products(id) ON DELETE SET NULL,
  description        text        NOT NULL,
  quantity           integer     NOT NULL DEFAULT 1,
  unit_price         numeric(12,2) NOT NULL DEFAULT 0,
  gst_percentage     numeric(5,2)  NOT NULL DEFAULT 0,
  hsn_sac_code       text,
  base_amount        numeric(12,2) NOT NULL DEFAULT 0,
  gst_amount         numeric(12,2) NOT NULL DEFAULT 0,
  total              numeric(12,2) NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_po_items" ON purchase_order_items;
CREATE POLICY "anon_select_po_items" ON purchase_order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_po_items" ON purchase_order_items;
CREATE POLICY "anon_insert_po_items" ON purchase_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_po_items" ON purchase_order_items;
CREATE POLICY "anon_update_po_items" ON purchase_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_po_items" ON purchase_order_items;
CREATE POLICY "anon_delete_po_items" ON purchase_order_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type  text        NOT NULL CHECK (movement_type IN ('purchase','sale','adjustment','return','transfer')),
  quantity       integer     NOT NULL,
  reference_type text,
  reference_id   text,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_stock_movements" ON stock_movements;
CREATE POLICY "anon_select_stock_movements" ON stock_movements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_stock_movements" ON stock_movements;
CREATE POLICY "anon_insert_stock_movements" ON stock_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stock_movements" ON stock_movements;
CREATE POLICY "anon_update_stock_movements" ON stock_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stock_movements" ON stock_movements;
CREATE POLICY "anon_delete_stock_movements" ON stock_movements FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. OFFLINE SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS offline_sales (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text        NOT NULL DEFAULT '',
  customer_name  text        NOT NULL,
  customer_phone text,
  customer_email text,
  customer_address text,
  customer_gst   text,
  subtotal       numeric(12,2) NOT NULL DEFAULT 0,
  gst_total      numeric(12,2) NOT NULL DEFAULT 0,
  grand_total    numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text        NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  amount_paid    numeric(12,2) NOT NULL DEFAULT 0,
  sale_date      date        NOT NULL DEFAULT CURRENT_DATE,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE offline_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_offline_sales" ON offline_sales;
CREATE POLICY "anon_select_offline_sales" ON offline_sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_offline_sales" ON offline_sales;
CREATE POLICY "anon_insert_offline_sales" ON offline_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_offline_sales" ON offline_sales;
CREATE POLICY "anon_update_offline_sales" ON offline_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_offline_sales" ON offline_sales;
CREATE POLICY "anon_delete_offline_sales" ON offline_sales FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. OFFLINE SALE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS offline_sale_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offline_sale_id uuid        NOT NULL REFERENCES offline_sales(id) ON DELETE CASCADE,
  product_id      uuid        REFERENCES products(id) ON DELETE SET NULL,
  description     text        NOT NULL,
  quantity        integer     NOT NULL DEFAULT 1,
  unit_price      numeric(12,2) NOT NULL DEFAULT 0,
  gst_percentage  numeric(5,2)  NOT NULL DEFAULT 0,
  base_amount     numeric(12,2) NOT NULL DEFAULT 0,
  gst_amount      numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE offline_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_offline_sale_items" ON offline_sale_items;
CREATE POLICY "anon_select_offline_sale_items" ON offline_sale_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_offline_sale_items" ON offline_sale_items;
CREATE POLICY "anon_insert_offline_sale_items" ON offline_sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_offline_sale_items" ON offline_sale_items;
CREATE POLICY "anon_update_offline_sale_items" ON offline_sale_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_offline_sale_items" ON offline_sale_items;
CREATE POLICY "anon_delete_offline_sale_items" ON offline_sale_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 7. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text        NOT NULL DEFAULT 'other' CHECK (category IN ('rent','salaries','utilities','marketing','purchasing','logistics','maintenance','other')),
  description   text        NOT NULL,
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  gst_amount    numeric(12,2) NOT NULL DEFAULT 0,
  total_amount  numeric(12,2) NOT NULL DEFAULT 0,
  payment_mode  text        NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash','upi','bank','cheque','card')),
  paid_to       text,
  expense_date  date        NOT NULL DEFAULT CURRENT_DATE,
  receipt_url   text,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 8. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type   text        NOT NULL CHECK (payment_type IN ('receivable','payable')),
  party_name     text        NOT NULL,
  reference_type text,
  reference_id   text,
  amount         numeric(12,2) NOT NULL DEFAULT 0,
  payment_mode   text        NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash','upi','bank','cheque','card')),
  payment_date   date        NOT NULL DEFAULT CURRENT_DATE,
  transaction_id text,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_offline_sale_date ON offline_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_offline_items ON offline_sale_items(offline_sale_id);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(payment_date);

-- ============================================================
-- PO NUMBER SEQUENCE + RPC
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;

CREATE OR REPLACE FUNCTION get_next_po_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'PO-' || EXTRACT(YEAR FROM now())::text || '-' || lpad(nextval('po_number_seq')::text, 4, '0')
$$;

-- ============================================================
-- OFFLINE SALE INVOICE NUMBER SEQUENCE + RPC
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS offline_invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION get_next_offline_invoice_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'OS-' || EXTRACT(YEAR FROM now())::text || '-' || lpad(nextval('offline_invoice_number_seq')::text, 4, '0')
$$;

-- ============================================================
-- UPDATED_AT TRIGGER (reuse existing function if present)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;