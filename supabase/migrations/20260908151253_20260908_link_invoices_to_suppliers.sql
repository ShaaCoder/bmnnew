/*
# Link invoices to saved suppliers

## Overview
Adds an optional supplier reference to invoices so the Create Invoice form can use an existing supplier record and automatically fill the invoice customer details.

## Modified Table
- `invoices`
- `supplier_id`: optional reference to the selected supplier

## Security
- Existing invoice row-level security remains unchanged.
- The reference is nullable so existing invoices are preserved and continue to work.

## Important Notes
1. Existing invoices keep all their current data and have a null supplier reference until edited.
2. Supplier information is copied into the invoice fields at save time so historical invoices remain stable if a supplier is later edited.
*/

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS invoices_supplier_id_idx ON invoices(supplier_id);