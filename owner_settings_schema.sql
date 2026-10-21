-- Security Update: Restrict Deposit Settings Management to Owner Only

-- 1. Create a function to explicitly check for the Owner role
CREATE OR REPLACE FUNCTION public.is_owner(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cb_admins s
    WHERE s.id::text = check_user_id::text 
      AND (s.account_id = 'OWNER' OR s.email = 'owner@wallmark.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the existing admin policy that allowed any admin to manage deposit settings
DROP POLICY IF EXISTS "Admins manage deposit settings" ON public.cb_deposit_settings;

-- 3. Create the new policy that only allows the Owner to manage deposit settings
CREATE POLICY "Owner manages deposit settings" ON public.cb_deposit_settings
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Note: The "Public select deposit settings" policy remains intact so users can still read the address.
