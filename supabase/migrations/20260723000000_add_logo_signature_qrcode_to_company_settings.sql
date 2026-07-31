/*
# Add branding columns to company_settings

Adds `logo_url`, `signature_url`, and `qr_code_url` to the company_settings table for invoice branding.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'logo_url') THEN
    ALTER TABLE company_settings ADD COLUMN logo_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'signature_url') THEN
    ALTER TABLE company_settings ADD COLUMN signature_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'qr_code_url') THEN
    ALTER TABLE company_settings ADD COLUMN qr_code_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'created_at') THEN
    ALTER TABLE company_settings ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;
