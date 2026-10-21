-- ==============================================================================
-- FIX RLS & GRANT RPC PERMISSIONS FOR ADMIN & STAFF CREATION
-- Run this in your Supabase SQL Editor to enable direct table writes & RPC calls
-- ==============================================================================

-- 1. Grant RPC Execution Permissions to public/anon/authenticated roles
GRANT EXECUTE ON FUNCTION public.create_admin_member TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_staff_member TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role TO anon, authenticated, service_role;

-- 2. Enable Public/Anon Row Level Security Management on cb_admins
ALTER TABLE public.cb_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admins" ON public.cb_admins;
DROP POLICY IF EXISTS "Public manage admins" ON public.cb_admins;

CREATE POLICY "Public manage admins" ON public.cb_admins
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- 3. Enable Public/Anon Row Level Security Management on cb_staff
ALTER TABLE public.cb_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Public manage staff" ON public.cb_staff;

CREATE POLICY "Public manage staff" ON public.cb_staff
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- 4. Enable Public/Anon Row Level Security Management on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage user roles" ON public.user_roles;

CREATE POLICY "Public manage user roles" ON public.user_roles
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);
