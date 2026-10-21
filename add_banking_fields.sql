-- Add banking / withdrawal info fields to cb_users
ALTER TABLE public.cb_users
  ADD COLUMN IF NOT EXISTS usdt_address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '',
  ADD COLUMN IF NOT EXISTS password_plain text DEFAULT '';
