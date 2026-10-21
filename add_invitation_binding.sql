-- Add invited_by_user_id field to cb_users to track user-to-user invitation binding
ALTER TABLE public.cb_users
  ADD COLUMN IF NOT EXISTS invited_by_user_id text DEFAULT '';

-- This stores the invite_code of the person who invited this user (user-to-user referral)
-- Separate from referred_by_staff_id which tracks the staff node
