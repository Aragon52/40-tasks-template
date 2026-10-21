-- Add withdrawal password field to cb_users
ALTER TABLE public.cb_users
  ADD COLUMN IF NOT EXISTS withdraw_password TEXT DEFAULT '';
