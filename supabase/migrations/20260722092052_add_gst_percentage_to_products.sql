/*
# Add GST percentage column to products table

1. Changes
- Added `gst_percentage` column to `products` table.
- Type: numeric, default 18 (standard GST rate in India).
- Nullable: no (has default).
- This allows admins to set a per-product GST rate which will be used
  to calculate GST breakdown (CGST + SGST) when customers place orders.

2. Security
- No RLS policy changes. Existing policies remain intact.
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS gst_percentage numeric DEFAULT 18 NOT NULL;
