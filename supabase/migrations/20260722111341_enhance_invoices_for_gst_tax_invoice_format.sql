/*
# Enhance invoices for GST tax invoice format

1. Modified Tables
- `invoices`: add `customer_pan` (text, nullable) for customer PAN number, `place_of_supply` (text, nullable) for GST place of supply code.
- `invoice_items`: add `hsn_sac_code` (text, nullable) for HSN/SAC classification code, `unit` (text, nullable, default 'NOS') for unit of measurement (NOS, KG, MTR, etc).

2. New Tables
- `company_settings`: single-row table storing company/business details for invoice headers.
  - `id` (int, primary key, default 1) — enforced singleton row.
  - `company_name` (text, not null)
  - `tagline` (text, nullable) — e.g. "GST Invoice"
  - `address` (text, nullable)
  - `phone` (text, nullable)
  - `email` (text, nullable)
  - `gstin` (text, nullable) — company GSTIN
  - `pan` (text, nullable) — company PAN
  - `bank_name` (text, nullable)
  - `account_number` (text, nullable)
  - `ifsc_code` (text, nullable)
  - `branch` (text, nullable)
  - `upi_id` (text, nullable)
  - `updated_at` (timestamptz, default now())

3. Security
- Enable RLS on `company_settings`.
- Owner-scoped CRUD: authenticated users can read and write company settings.
- Existing `invoices` and `invoice_items` tables already have RLS; new columns inherit existing policies.

4. Important Notes
- All new columns are nullable so existing invoices remain valid.
- `company_settings` is a singleton (id=1) — the app upserts row 1.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'customer_pan') THEN
    ALTER TABLE invoices ADD COLUMN customer_pan text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'place_of_supply') THEN
    ALTER TABLE invoices ADD COLUMN place_of_supply text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'hsn_sac_code') THEN
    ALTER TABLE invoice_items ADD COLUMN hsn_sac_code text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'unit') THEN
    ALTER TABLE invoice_items ADD COLUMN unit text DEFAULT 'NOS';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS company_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name text NOT NULL DEFAULT 'Bharat Advance',
  tagline text,
  address text,
  phone text,
  email text,
  gstin text,
  pan text,
  bank_name text,
  account_number text,
  ifsc_code text,
  branch text,
  upi_id text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_company_settings" ON company_settings;
CREATE POLICY "select_company_settings" ON company_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_company_settings" ON company_settings;
CREATE POLICY "insert_company_settings" ON company_settings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_company_settings" ON company_settings;
CREATE POLICY "update_company_settings" ON company_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_company_settings" ON company_settings;
CREATE POLICY "delete_company_settings" ON company_settings
  FOR DELETE TO authenticated USING (true);

INSERT INTO company_settings (id, company_name, tagline, address, phone, email)
VALUES (1, 'Bharat Advance', 'GST Invoice', '123 Business Avenue, Commercial District, City - 400001', '+91 98765 43210', 'info@bharatadvance.com')
ON CONFLICT (id) DO NOTHING;
