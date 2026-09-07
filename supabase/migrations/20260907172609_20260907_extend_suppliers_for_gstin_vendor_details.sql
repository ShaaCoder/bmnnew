/*
# Extend suppliers with GST vendor details

## Overview
Adds the business and accounting fields needed for the Supplier/Vendor form. GSTIN verification can now fill the supplier name and billing address while the remaining commercial details are saved with the supplier.

## Modified Table
- `suppliers`
- `company_type`: customer/vendor classification, default vendor
- `registration_type`: GST registration classification, default unregistered
- `address_line_2`, `landmark`, `city`, `state`, `country`, `pincode`: structured billing address
- `opening_balance`, `balance_type`: opening payable/credit balance
- `license_no`, `custom_field_1`, `custom_field_2`: custom business identifiers
- `fax_no`, `website`, `credit_limit`, `due_days`: additional supplier terms
- `visible_on_documents`: whether the supplier can appear on generated documents

## Security
- Existing supplier RLS policies remain unchanged.
- No data is removed or renamed; all new fields are nullable or have safe defaults.

## Important Notes
1. Existing suppliers remain valid because every new field has a default or accepts null.
2. GST verification continues to run through the server-side `verify-gstin` function; the API key is not exposed to the browser.
*/

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_type text NOT NULL DEFAULT 'vendor';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS registration_type text NOT NULL DEFAULT 'unregistered';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_line_2 text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'India';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS opening_balance numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS balance_type text NOT NULL DEFAULT 'credit';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS license_no text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS custom_field_1 text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS custom_field_2 text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS fax_no text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_limit numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS due_days integer NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS visible_on_documents boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_company_type_check') THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_company_type_check CHECK (company_type IN ('customer', 'vendor', 'customer_vendor'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_balance_type_check') THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_balance_type_check CHECK (balance_type IN ('credit', 'debit'));
  END IF;
END $$;