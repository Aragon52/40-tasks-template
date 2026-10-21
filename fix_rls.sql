-- 1. Create a secure function to check if a user is an admin without infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cb_admins s
    WHERE s.id::text = check_user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the policies for cb_admins
DROP POLICY IF EXISTS "Admins manage admins" ON public.cb_admins;
CREATE POLICY "Admins manage admins" ON public.cb_admins
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Fix the policies for cb_staff
DROP POLICY IF EXISTS "Admins manage staff" ON public.cb_staff;
CREATE POLICY "Admins manage staff" ON public.cb_staff
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
