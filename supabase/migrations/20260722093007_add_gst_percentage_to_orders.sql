/*
# Add gst_percentage to orders table

1. Changes
   - Added `gst_percentage` numeric column to `orders` table (default 18).
   - This captures the GST rate at the time the order is placed, so invoices
     always reflect the exact tax charged even if the product rate changes later.
*/

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS gst_percentage numeric DEFAULT 18 NOT NULL;
