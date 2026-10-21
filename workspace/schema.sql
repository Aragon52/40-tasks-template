-- ==============================================================================
-- WALMART / ORDER PICKING PLATFORM - COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Define App Roles Enum & User Roles Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey' AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE ONLY public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 3. Define Helper Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM public.cb_admins s
    WHERE s.id::text = check_user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cb_admins s
    WHERE s.id::text = check_user_id::text 
      AND (s.account_id = 'OWNER' OR s.email = 'arkarnaung009@gmail.com' OR s.email = 'owner@wallmark.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Core Application Tables
CREATE TABLE IF NOT EXISTS public.cb_admins (
    id text PRIMARY KEY,
    account_id text UNIQUE NOT NULL,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    status text DEFAULT 'Active',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_staff (
    id text PRIMARY KEY,
    staff_id text UNIQUE NOT NULL,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    status text DEFAULT 'Active',
    created_by_admin_id text,
    department text,
    referral_code text,
    profile_photo text, -- Used for staff permissions JSON
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id text,
    admin_name text,
    action text NOT NULL,
    details text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_deposit_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name text NOT NULL,
    wallet_address text NOT NULL,
    qr_code_url text,
    min_amount numeric DEFAULT 10,
    max_amount numeric DEFAULT 50000,
    is_active boolean DEFAULT true,
    btc_address text DEFAULT '',
    eth_address text DEFAULT '',
    bnb_address text DEFAULT '',
    xrp_address text DEFAULT '',
    sol_address text DEFAULT '',
    doge_address text DEFAULT '',
    usdt_erc20_address text DEFAULT '',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_users (
    id text PRIMARY KEY,
    account_id text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password text,
    password_plain text,
    balance numeric DEFAULT 0,
    frozen_balance numeric DEFAULT 0,
    commission_rate numeric DEFAULT 0.05,
    credit_score integer DEFAULT 100,
    status text DEFAULT 'Active',
    online text DEFAULT 'Offline',
    invite_code text UNIQUE,
    referred_by_staff_id text,
    invited_by_user_id text DEFAULT '',
    usdt_address text DEFAULT '',
    bank_name text DEFAULT '',
    bank_account text DEFAULT '',
    bank_holder text DEFAULT '',
    withdraw_password text DEFAULT '',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_deposits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    username text,
    amount numeric NOT NULL,
    network text,
    tx_hash text,
    proof_image_url text,
    status text DEFAULT 'Pending', -- Pending, Approved, Rejected
    remark text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_withdrawals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    username text,
    amount numeric NOT NULL,
    method text, -- USDT or Bank
    destination text,
    status text DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text UNIQUE NOT NULL,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    username text,
    product_name text,
    product_image text,
    amount numeric NOT NULL,
    commission numeric NOT NULL,
    total_amount numeric NOT NULL,
    status text DEFAULT 'Pending', -- Pending, Success, Frozen, Cancelled
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_assigned_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    task_sequence integer NOT NULL,
    total_tasks integer DEFAULT 40,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_support_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    user_username text,
    is_online boolean DEFAULT false,
    unread_admin_count integer DEFAULT 0,
    unread_user_count integer DEFAULT 0,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_support_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid REFERENCES public.cb_support_sessions(id) ON DELETE CASCADE,
    sender text NOT NULL, -- 'user' or 'admin'
    content text,
    image_url text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.cb_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_deposit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_support_messages ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies
DROP POLICY IF EXISTS "Admins manage admins" ON public.cb_admins;
DROP POLICY IF EXISTS "Public manage admins" ON public.cb_admins;
CREATE POLICY "Public manage admins" ON public.cb_admins FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Public select active staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Public manage staff" ON public.cb_staff;
CREATE POLICY "Public manage staff" ON public.cb_staff FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage audit logs" ON public.cb_audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.cb_audit_logs FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage deposit settings" ON public.cb_deposit_settings;
DROP POLICY IF EXISTS "Owner manages deposit settings" ON public.cb_deposit_settings;
DROP POLICY IF EXISTS "Public select deposit settings" ON public.cb_deposit_settings;
CREATE POLICY "Owner manages deposit settings" ON public.cb_deposit_settings FOR ALL TO authenticated USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Public select deposit settings" ON public.cb_deposit_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins manage users" ON public.cb_users;
DROP POLICY IF EXISTS "Public manage users" ON public.cb_users;
CREATE POLICY "Admins manage users" ON public.cb_users FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage users" ON public.cb_users FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage deposits" ON public.cb_deposits;
DROP POLICY IF EXISTS "Public manage deposits" ON public.cb_deposits;
CREATE POLICY "Admins manage deposits" ON public.cb_deposits FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage deposits" ON public.cb_deposits FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage withdrawals" ON public.cb_withdrawals;
DROP POLICY IF EXISTS "Public manage withdrawals" ON public.cb_withdrawals;
CREATE POLICY "Admins manage withdrawals" ON public.cb_withdrawals FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage withdrawals" ON public.cb_withdrawals FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage orders" ON public.cb_orders;
DROP POLICY IF EXISTS "Public manage orders" ON public.cb_orders;
CREATE POLICY "Admins manage orders" ON public.cb_orders FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage orders" ON public.cb_orders FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage assigned tasks" ON public.cb_assigned_tasks;
DROP POLICY IF EXISTS "Public manage assigned tasks" ON public.cb_assigned_tasks;
CREATE POLICY "Admins manage assigned tasks" ON public.cb_assigned_tasks FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage assigned tasks" ON public.cb_assigned_tasks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage all sessions" ON public.cb_support_sessions;
DROP POLICY IF EXISTS "Public manage sessions" ON public.cb_support_sessions;
CREATE POLICY "Admins manage all sessions" ON public.cb_support_sessions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage sessions" ON public.cb_support_sessions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage all messages" ON public.cb_support_messages;
DROP POLICY IF EXISTS "Public manage messages" ON public.cb_support_messages;
CREATE POLICY "Admins manage all messages" ON public.cb_support_messages FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public manage messages" ON public.cb_support_messages FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. Storage Bucket & Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('cb_storage', 'cb_storage', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can update" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'cb_storage' );
CREATE POLICY "Public can upload" ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'cb_storage' );
CREATE POLICY "Public can update" ON storage.objects FOR UPDATE TO public USING ( bucket_id = 'cb_storage' ) WITH CHECK ( bucket_id = 'cb_storage' );
CREATE POLICY "Public can delete" ON storage.objects FOR DELETE TO public USING ( bucket_id = 'cb_storage' );

-- 8. RPC Functions for Account Creation
CREATE OR REPLACE FUNCTION public.create_admin_member(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_account_id text
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_identity_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user
    )
    VALUES (
      v_user_id, p_email, crypt(p_password, gen_salt('bf', 10)), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text),
      'authenticated', 'authenticated', now(), now(), false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_identity_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false), 'email', p_email, now(), now(), now())
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.cb_admins (id, account_id, name, email, phone, status, created_at)
  VALUES (v_user_id::text, p_account_id, p_name, p_email, p_phone, 'Active', now())
  ON CONFLICT (id) DO UPDATE SET account_id = EXCLUDED.account_id, name = EXCLUDED.name, phone = EXCLUDED.phone, status = 'Active';
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_staff_member(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_staff_id text,
  p_admin_id text,
  p_department text,
  p_referral_code text
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_identity_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user
    )
    VALUES (
      v_user_id, p_email, crypt(p_password, gen_salt('bf', 10)), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text),
      'authenticated', 'authenticated', now(), now(), false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_identity_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false), 'email', p_email, now(), now(), now())
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.cb_staff (id, staff_id, name, email, phone, status, created_by_admin_id, department, referral_code, created_at)
  VALUES (v_user_id::text, p_staff_id, p_name, p_email, p_phone, 'Active', p_admin_id, p_department, p_referral_code, now())
  ON CONFLICT (id) DO UPDATE SET staff_id = EXCLUDED.staff_id, name = EXCLUDED.name, phone = EXCLUDED.phone, status = 'Active', department = EXCLUDED.department, referral_code = EXCLUDED.referral_code;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Seed System Owner
DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'arkarnaung009@gmail.com';
  IF v_owner_id IS NULL THEN
    v_owner_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    )
    VALUES (
      v_owner_id,
      'arkarnaung009@gmail.com',
      '$2a$10$C94rKwGREbwx9evBOnTud.O1CpB1/9AijjZrVf6PzXGMFzkJrqJL2', -- Aragon@1226
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', 'System Owner', 'email', 'arkarnaung009@gmail.com', 'email_verified', true, 'phone_verified', false, 'sub', v_owner_id::text),
      'authenticated',
      'authenticated',
      now(),
      now()
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_owner_id,
      jsonb_build_object('sub', v_owner_id::text, 'email', 'arkarnaung009@gmail.com', 'email_verified', true, 'phone_verified', false),
      'email',
      v_owner_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.cb_admins WHERE account_id = 'OWNER';
  INSERT INTO public.cb_admins (id, account_id, name, email, phone, status, created_at)
  VALUES (v_owner_id::text, 'OWNER', 'System Owner', 'arkarnaung009@gmail.com', 'System', 'Active', now());
END;
$$;

-- 10. Grant RPC Function Execution Permissions
GRANT EXECUTE ON FUNCTION public.create_admin_member TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_staff_member TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role TO anon, authenticated, service_role;
