/*
# HSN Codes Table with Seed Data

## Overview
Creates a new `hsn_codes` table to store reusable HSN/SAC codes for invoices.
When the admin types a new HSN code in the invoice form, it will be saved
here automatically so it appears as a suggestion next time.

## 1. New Table
### hsn_codes
- id (uuid, PK)
- code (text, unique, not null) — the HSN/SAC code string
- description (text, nullable) — optional human-readable description
- created_at (timestamptz)

## 2. Security
- RLS enabled.
- Single-tenant app: anon + authenticated full CRUD (data is intentionally shared).

## 3. Seed Data
Preloads the following HSN codes provided by the business:
3307, 33074900, 33074100, 3401, 34011941, 34011942, 34012000,
3402, 340220, 340211, 340231, 340239, 340241, 340242, 340290, 3405

## 4. Important Notes
- The `code` column has a UNIQUE constraint so re-inserts are safe via ON CONFLICT.
- The invoice form will query this table for autocomplete suggestions and
  insert new codes on blur / save when the admin types a code not yet in the list.
*/

CREATE TABLE IF NOT EXISTS hsn_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL UNIQUE,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE hsn_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hsn_codes" ON hsn_codes;
CREATE POLICY "anon_select_hsn_codes" ON hsn_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hsn_codes" ON hsn_codes;
CREATE POLICY "anon_insert_hsn_codes" ON hsn_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hsn_codes" ON hsn_codes;
CREATE POLICY "anon_update_hsn_codes" ON hsn_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hsn_codes" ON hsn_codes;
CREATE POLICY "anon_delete_hsn_codes" ON hsn_codes FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO hsn_codes (code) VALUES
  ('3307'),
  ('33074900'),
  ('33074100'),
  ('3401'),
  ('34011941'),
  ('34011942'),
  ('34012000'),
  ('3402'),
  ('340220'),
  ('340211'),
  ('340231'),
  ('340239'),
  ('340241'),
  ('340242'),
  ('340290'),
  ('3405')
ON CONFLICT (code) DO NOTHING;