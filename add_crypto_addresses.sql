-- Add per-cryptocurrency deposit address columns to cb_deposit_settings
ALTER TABLE public.cb_deposit_settings
  ADD COLUMN IF NOT EXISTS btc_address    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS eth_address    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bnb_address    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS xrp_address    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sol_address    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS doge_address   text DEFAULT '',
  ADD COLUMN IF NOT EXISTS usdt_erc20_address text DEFAULT '';

-- Note: usdt_address column already exists (used for TRC20)
-- Run this in Supabase SQL Editor
