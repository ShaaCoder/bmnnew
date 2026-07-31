CREATE POLICY "Public can view company settings" ON company_settings
  FOR SELECT TO anon USING (true);