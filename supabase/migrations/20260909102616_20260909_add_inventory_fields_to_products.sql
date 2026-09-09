/*
# Add inventory management columns to products

## Overview
Extends the products table with inventory-specific fields for offline/physical store product management: barcode, SKU, UOM, cost price, minimum/reorder stock levels, and a flag to mark products as offline inventory items.

## Modified Tables
- `products`
  - `barcode` (text, nullable) — product barcode for scanning
  - `sku` (text, nullable) — stock keeping unit / internal product code
  - `uom` (text, default 'NOS') — unit of measure (NOS, KG, MTR, etc.)
  - `cost_price` (numeric, default 0) — purchase/landing cost per unit for valuation
  - `min_stock` (integer, default 0) — reorder threshold; alerts when stock falls at or below this
  - `is_offline` (boolean, default false) — marks products managed in the offline inventory system

## Data Safety
- All new columns are nullable or have safe defaults.
- Existing products are unchanged and continue to display normally.
- No columns are removed or renamed.

## Security
- Existing RLS policies on products remain unchanged.
- No new tables or access rules are introduced.

## Important Notes
1. The min_stock field drives low-stock alerts in the inventory dashboard.
2. cost_price is used for inventory valuation (cost_price * stock).
3. is_offline lets you filter products that are managed in the physical store vs online catalog.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS uom text NOT NULL DEFAULT 'NOS';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offline boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_offline ON products(is_offline);