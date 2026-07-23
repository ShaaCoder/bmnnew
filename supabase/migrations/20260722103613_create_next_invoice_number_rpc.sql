/*
# Create next_invoice_number RPC function

## Overview
Creates a PostgreSQL function that returns the next invoice number sequence value.
This is called from the frontend via supabase.rpc() when creating a new invoice
to generate sequential invoice numbers like INV-2026-0001.

## Changes
- Creates function `next_invoice_number()` that returns bigint.
- Uses the `invoice_number_seq` sequence created in the previous migration.
- SECURITY DEFINER so the anon role can call it.
*/

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT nextval('invoice_number_seq');
$$;

GRANT EXECUTE ON FUNCTION next_invoice_number() TO anon, authenticated;