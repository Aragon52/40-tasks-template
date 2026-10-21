-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure public.app_role enum type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END;
$$;

-- Ensure public.user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Ensure foreign key constraint is present on user_roles
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

-- Ensure has_role helper function exists
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 1. Enable Row Level Security (RLS) on all cb_ tables
ALTER TABLE public.cb_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_deposit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.cb_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_assigned_tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins manage admins" ON public.cb_admins;
DROP POLICY IF EXISTS "Admins manage staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Public select active staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Admins manage audit logs" ON public.cb_audit_logs;
DROP POLICY IF EXISTS "Admins manage deposit settings" ON public.cb_deposit_settings;
DROP POLICY IF EXISTS "Public select deposit settings" ON public.cb_deposit_settings;
DROP POLICY IF EXISTS "Admins manage users" ON public.cb_users;
DROP POLICY IF EXISTS "Public manage users" ON public.cb_users;
DROP POLICY IF EXISTS "Admins manage deposits" ON public.cb_deposits;
DROP POLICY IF EXISTS "Public manage deposits" ON public.cb_deposits;
DROP POLICY IF EXISTS "Admins manage withdrawals" ON public.cb_withdrawals;
DROP POLICY IF EXISTS "Public manage withdrawals" ON public.cb_withdrawals;
DROP POLICY IF EXISTS "Admins manage orders" ON public.cb_orders;
DROP POLICY IF EXISTS "Public manage orders" ON public.cb_orders;
DROP POLICY IF EXISTS "Admins manage assigned tasks" ON public.cb_assigned_tasks;
DROP POLICY IF EXISTS "Public manage assigned tasks" ON public.cb_assigned_tasks;

-- 3. Define RLS Policies

-- cb_admins: Only admins can perform any operations
CREATE POLICY "Admins manage admins" ON public.cb_admins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- cb_staff: Admins can manage, public can only select active staff (referral check)
CREATE POLICY "Admins manage staff" ON public.cb_staff
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public select active staff" ON public.cb_staff
  FOR SELECT TO public
  USING (status = 'Active');

-- cb_audit_logs: Only admins can manage
CREATE POLICY "Admins manage audit logs" ON public.cb_audit_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- cb_deposit_settings: Admins can manage, public can select (read wallet addresses)
CREATE POLICY "Admins manage deposit settings" ON public.cb_deposit_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public select deposit settings" ON public.cb_deposit_settings
  FOR SELECT TO public
  USING (true);

-- cb_users: Admins have full access, public has full access (since user portal is table-based)
CREATE POLICY "Admins manage users" ON public.cb_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public manage users" ON public.cb_users
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- cb_deposits: Admins have full access, public has full access
CREATE POLICY "Admins manage deposits" ON public.cb_deposits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public manage deposits" ON public.cb_deposits
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- cb_withdrawals: Admins have full access, public has full access
CREATE POLICY "Admins manage withdrawals" ON public.cb_withdrawals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public manage withdrawals" ON public.cb_withdrawals
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- cb_orders: Admins have full access, public has full access
CREATE POLICY "Admins manage orders" ON public.cb_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public manage orders" ON public.cb_orders
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- cb_assigned_tasks: Admins have full access, public has full access
CREATE POLICY "Admins manage assigned tasks" ON public.cb_assigned_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public manage assigned tasks" ON public.cb_assigned_tasks
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);


-- 4. Create RPC Helper Functions for Secure Account Generation

-- Function to create administrator accounts
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
  -- First, check if a user with this email already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Pre-generate the user UUID and distinct identity UUID
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();

    -- Insert into auth.users (Supabase authentication engine)
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      is_sso_user
    )
    VALUES (
      v_user_id,
      p_email,
      crypt(p_password, gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text),
      'authenticated',
      'authenticated',
      now(),
      now(),
      false -- is_sso_user MUST be false for email/password users
    );

    -- Create corresponding record in auth.identities with a separate distinct UUID for 'id'
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_identity_id, -- Use distinct UUID
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
      'email',
      p_email, -- Must be the email
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  ELSE
    -- User already exists natively (signed up via client). Let's make sure they are confirmed just in case.
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text)
    WHERE id = v_user_id;
  END IF;

  -- Map permissions to app role 'admin' in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Add record in cb_admins linking the new uuid
  INSERT INTO public.cb_admins (id, account_id, name, email, phone, status, created_at)
  VALUES (v_user_id::text, p_account_id, p_name, p_email, p_phone, 'Active', now())
  ON CONFLICT (id) DO UPDATE
  SET account_id = EXCLUDED.account_id,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      status = 'Active';

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create staff accounts
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
  -- First, check if a user with this email already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Pre-generate the user UUID and distinct identity UUID
    v_user_id := gen_random_uuid();
    v_identity_id := gen_random_uuid();

    -- Insert into auth.users (Supabase authentication engine)
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      is_sso_user
    )
    VALUES (
      v_user_id,
      p_email,
      crypt(p_password, gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text),
      'authenticated',
      'authenticated',
      now(),
      now(),
      false -- is_sso_user MUST be false
    );

    -- Create corresponding record in auth.identities with a separate distinct UUID for 'id'
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_identity_id, -- Use distinct UUID
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
      'email',
      p_email,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  ELSE
    -- User already exists natively (signed up via client). Let's make sure they are confirmed just in case.
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('name', p_name, 'email', p_email, 'email_verified', true, 'phone_verified', false, 'sub', v_user_id::text)
    WHERE id = v_user_id;
  END IF;

  -- Map permissions to app role 'admin' in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Add record in cb_staff linking the new uuid
  INSERT INTO public.cb_staff (id, staff_id, name, email, phone, status, created_by_admin_id, department, referral_code, created_at)
  VALUES (v_user_id::text, p_staff_id, p_name, p_email, p_phone, 'Active', p_admin_id, p_department, p_referral_code, now())
  ON CONFLICT (id) DO UPDATE
  SET staff_id = EXCLUDED.staff_id,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      status = 'Active',
      created_by_admin_id = EXCLUDED.created_by_admin_id,
      department = EXCLUDED.department,
      referral_code = EXCLUDED.referral_code;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Seed Owner and Migrate Existing Seed Accounts

-- Loop and seed owner + migrate existing records
DO $$
DECLARE
  v_owner_id uuid;
  v_admin_rec RECORD;
  v_staff_rec RECORD;
  v_new_id uuid;
BEGIN
  -- 1. Create or retrieve Owner account (owner@wallmark.com)  -- Create initial owner if not exists
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'arkarnaung009@gmail.com';
  
  IF v_owner_id IS NULL THEN
    v_owner_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    )
    VALUES (
      v_owner_id,
      'arkarnaung009@gmail.com',
      '$2a$10$C94rKwGREbwx9evBOnTud.O1CpB1/9AijjZrVf6PzXGMFzkJrqJL2', -- Valid GoTrue hash for Aragon@1226
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', 'System Owner', 'email', 'arkarnaung009@gmail.com', 'email_verified', true, 'phone_verified', false, 'sub', v_owner_id::text),
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    -- Insert into auth.identities (Required for login)
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), -- MUST be a distinct random UUID
      v_owner_id,
      jsonb_build_object('sub', v_owner_id::text, 'email', 'arkarnaung009@gmail.com', 'email_verified', true, 'phone_verified', false),
      'email',
      v_owner_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- Create user_roles row for the owner
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Insert Owner in cb_admins (delete first to avoid ON CONFLICT matches since no unique constraint on account_id or email is guaranteed)
  DELETE FROM public.cb_admins WHERE account_id = 'OWNER';
  INSERT INTO public.cb_admins (id, account_id, name, email, phone, status, created_at)
  VALUES (v_owner_id::text, 'OWNER', 'System Owner', 'arkarnaung009@gmail.com', 'System', 'Active', now());


  -- 2. Migrate existing cb_admins to auth.users (if not already mapped in auth.users)
  FOR v_admin_rec IN SELECT * FROM public.cb_admins WHERE account_id <> 'OWNER' LOOP
    -- If their current id is not a valid UUID (e.g. starts with 'admin-'), they need an auth.users mapping
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_rec.email) THEN
      v_new_id := gen_random_uuid();
      
      -- Create auth record (default password 'admin123')
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
      VALUES (
        v_new_id,
        v_admin_rec.email,
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_admin_rec.name, 'email', v_admin_rec.email, 'email_verified', true, 'phone_verified', false, 'sub', v_new_id::text),
        'authenticated',
        'authenticated',
        now(),
        now()
      );
      
      -- Create corresponding identity
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (
        v_new_id,
        v_new_id,
        jsonb_build_object('sub', v_new_id::text, 'email', v_admin_rec.email, 'email_verified', true, 'phone_verified', false),
        'email',
        v_new_id::text,
        now(),
        now(),
        now()
      )
      ON CONFLICT DO NOTHING;

      -- Map permissions
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_new_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Update the cb_admins row with the new uuid
      UPDATE public.cb_admins
      SET id = v_new_id::text
      WHERE account_id = v_admin_rec.account_id;
    END IF;
  END LOOP;


  -- 3. Migrate existing cb_staff to auth.users (if not already mapped in auth.users)
  FOR v_staff_rec IN SELECT * FROM public.cb_staff LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_staff_rec.email) THEN
      v_new_id := gen_random_uuid();
      
      -- Create auth record (default password 'staff123')
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
      VALUES (
        v_new_id,
        v_staff_rec.email,
        crypt('staff123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_staff_rec.name, 'email', v_staff_rec.email, 'email_verified', true, 'phone_verified', false, 'sub', v_new_id::text),
        'authenticated',
        'authenticated',
        now(),
        now()
      );
      
      -- Create corresponding identity
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (
        v_new_id,
        v_new_id,
        jsonb_build_object('sub', v_new_id::text, 'email', v_staff_rec.email, 'email_verified', true, 'phone_verified', false),
        'email',
        v_new_id::text,
        now(),
        now(),
        now()
      )
      ON CONFLICT DO NOTHING;

      -- Map permissions
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_new_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Update the cb_staff row with the new uuid
      UPDATE public.cb_staff
      SET id = v_new_id::text
      WHERE staff_id = v_staff_rec.staff_id;
    END IF;
  END LOOP;

END;
$$;


-- 6. Debug RPC Helper Functions

CREATE OR REPLACE FUNCTION public.get_user_details(p_email text)
RETURNS TABLE (
  id uuid,
  email varchar,
  encrypted_password varchar,
  email_confirmed_at timestamptz,
  confirmed_at timestamptz,
  aud varchar,
  role varchar,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb
)
SECURITY DEFINER
AS $$
  SELECT 
    id,
    email::varchar,
    encrypted_password::varchar,
    email_confirmed_at,
    confirmed_at,
    aud::varchar,
    role::varchar,
    raw_app_meta_data,
    raw_user_meta_data
  FROM auth.users 
  WHERE email = p_email 
  LIMIT 1;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_identities(p_user_id uuid)
RETURNS TABLE (
  id text,
  user_id uuid,
  identity_data jsonb,
  provider text,
  provider_id text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
AS $$
  SELECT 
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  FROM auth.identities
  WHERE user_id = p_user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_raw_json(p_email text)
RETURNS jsonb
SECURITY DEFINER
AS $$
  SELECT row_to_json(u)::jsonb 
  FROM auth.users u 
  WHERE email = p_email 
  LIMIT 1;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_column_value(p_email text, p_column text)
RETURNS text
SECURITY DEFINER
AS $$
DECLARE
  v_val text;
BEGIN
  EXECUTE format('SELECT %I::text FROM auth.users WHERE email = %L LIMIT 1', p_column, p_email) INTO v_val;
  RETURN v_val;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_identity_raw_json(p_user_id uuid)
RETURNS jsonb
SECURITY DEFINER
AS $$
  SELECT json_agg(row_to_json(i))::jsonb 
  FROM auth.identities i 
  WHERE user_id = p_user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.delete_auth_user(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
