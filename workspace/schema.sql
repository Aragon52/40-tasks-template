-- ============================================================================
-- Secure Supabase schema for the marketplace / admin portal
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'::public.app_role
  ) OR EXISTS (
    SELECT 1
    FROM public.cb_admins a
    WHERE a.id = _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.cb_admins a
    WHERE a.id = _user_id
      AND (
        a.account_id = 'OWNER'
        OR a.email = 'arkarnaung009@gmail.com'
        OR a.email = 'owner@wallmark.com'
      )
  );
END;
$$;

CREATE TABLE IF NOT EXISTS public.cb_admins (
    id text PRIMARY KEY,
    account_id text NOT NULL UNIQUE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_staff (
    id text PRIMARY KEY,
    staff_id text NOT NULL UNIQUE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    created_by_admin_id text,
    department text,
    referral_code text,
    profile_photo text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id text,
    admin_name text,
    action text NOT NULL,
    details text,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_deposit_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name text NOT NULL,
    wallet_address text NOT NULL,
    qr_code_url text,
    min_amount numeric NOT NULL DEFAULT 10,
    max_amount numeric NOT NULL DEFAULT 50000,
    is_active boolean NOT NULL DEFAULT true,
    btc_address text NOT NULL DEFAULT '',
    eth_address text NOT NULL DEFAULT '',
    bnb_address text NOT NULL DEFAULT '',
    xrp_address text NOT NULL DEFAULT '',
    sol_address text NOT NULL DEFAULT '',
    doge_address text NOT NULL DEFAULT '',
    usdt_erc20_address text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_users (
    id text PRIMARY KEY,
    account_id text UNIQUE,
    username text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    phone text,
    password_hash text,
    balance numeric NOT NULL DEFAULT 0,
    frozen_balance numeric NOT NULL DEFAULT 0,
    commission_rate numeric NOT NULL DEFAULT 0.05,
    credit_score integer NOT NULL DEFAULT 100,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    online text NOT NULL DEFAULT 'Offline',
    invite_code text UNIQUE,
    referred_by_staff_id text,
    invited_by_user_id text NOT NULL DEFAULT '',
    usdt_address text NOT NULL DEFAULT '',
    bank_name text NOT NULL DEFAULT '',
    bank_account text NOT NULL DEFAULT '',
    bank_holder text NOT NULL DEFAULT '',
    withdraw_password_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_deposits (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    username text,
    amount numeric NOT NULL,
    network text,
    tx_hash text,
    proof_image_url text,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    remark text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.cb_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cb_withdrawals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    username text,
    amount numeric NOT NULL,
    method text,
    destination text,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.cb_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cb_orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text NOT NULL UNIQUE,
    user_id text,
    username text,
    product_name text,
    product_image text,
    amount numeric NOT NULL,
    commission numeric NOT NULL,
    total_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Frozen', 'Cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.cb_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cb_assigned_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    task_sequence integer NOT NULL,
    total_tasks integer NOT NULL DEFAULT 40,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_assigned_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.cb_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cb_support_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    user_username text,
    is_online boolean NOT NULL DEFAULT false,
    unread_admin_count integer NOT NULL DEFAULT 0,
    unread_user_count integer NOT NULL DEFAULT 0,
    last_message_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_support_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.cb_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cb_support_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid,
    sender text NOT NULL CHECK (sender IN ('user', 'admin')),
    content text,
    image_url text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cb_support_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cb_support_sessions(id) ON DELETE CASCADE
);

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
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_admins" ON public.cb_admins;
CREATE POLICY "admins_manage_admins"
ON public.cb_admins
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text));

DROP POLICY IF EXISTS "admins_manage_staff" ON public.cb_staff;
CREATE POLICY "admins_manage_staff"
ON public.cb_staff
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text));

DROP POLICY IF EXISTS "public_select_active_staff" ON public.cb_staff;
CREATE POLICY "public_select_active_staff"
ON public.cb_staff
FOR SELECT
TO public
USING (status = 'Active');

DROP POLICY IF EXISTS "admins_manage_audit_logs" ON public.cb_audit_logs;
CREATE POLICY "admins_manage_audit_logs"
ON public.cb_audit_logs
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text));

DROP POLICY IF EXISTS "admins_manage_deposit_settings" ON public.cb_deposit_settings;
CREATE POLICY "admins_manage_deposit_settings"
ON public.cb_deposit_settings
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text));

DROP POLICY IF EXISTS "public_select_deposit_settings" ON public.cb_deposit_settings;
CREATE POLICY "public_select_deposit_settings"
ON public.cb_deposit_settings
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admins_or_self_manage_users" ON public.cb_users;
CREATE POLICY "admins_or_self_manage_users"
ON public.cb_users
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = id);

DROP POLICY IF EXISTS "admins_manage_deposits" ON public.cb_deposits;
CREATE POLICY "admins_manage_deposits"
ON public.cb_deposits
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admins_manage_withdrawals" ON public.cb_withdrawals;
CREATE POLICY "admins_manage_withdrawals"
ON public.cb_withdrawals
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admins_manage_orders" ON public.cb_orders;
CREATE POLICY "admins_manage_orders"
ON public.cb_orders
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admins_manage_tasks" ON public.cb_assigned_tasks;
CREATE POLICY "admins_manage_tasks"
ON public.cb_assigned_tasks
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admins_or_self_manage_support_sessions" ON public.cb_support_sessions;
CREATE POLICY "admins_or_self_manage_support_sessions"
ON public.cb_support_sessions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id)
WITH CHECK (public.is_admin(auth.uid()::text) OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admins_or_self_manage_support_messages" ON public.cb_support_messages;
CREATE POLICY "admins_or_self_manage_support_messages"
ON public.cb_support_messages
FOR ALL
TO authenticated
USING (
  public.is_admin(auth.uid()::text)
  OR EXISTS (
    SELECT 1
    FROM public.cb_support_sessions s
    WHERE s.id = cb_support_messages.session_id
      AND s.user_id = auth.uid()::text
  )
)
WITH CHECK (
  public.is_admin(auth.uid()::text)
  OR EXISTS (
    SELECT 1
    FROM public.cb_support_sessions s
    WHERE s.id = cb_support_messages.session_id
      AND s.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "admins_manage_user_roles" ON public.user_roles;
CREATE POLICY "admins_manage_user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text));

INSERT INTO storage.buckets (id, name, public)
VALUES ('cb_storage', 'cb_storage', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_users_can_upload_to_cb_storage" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_read_own_storage" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_manage_cb_storage" ON storage.objects;

CREATE POLICY "authenticated_users_can_upload_to_cb_storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cb_storage');

CREATE POLICY "authenticated_users_can_read_own_storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cb_storage');

CREATE POLICY "admins_can_manage_cb_storage"
ON storage.objects
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()::text))
WITH CHECK (public.is_admin(auth.uid()::text) AND bucket_id = 'cb_storage');

CREATE OR REPLACE FUNCTION public.create_admin_member(
    p_email text,
    p_password text,
    p_name text,
    p_phone text,
    p_account_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin(auth.uid()::text) THEN
        RAISE EXCEPTION 'Only admins can create admin accounts';
    END IF;

    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at,
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
            false
        );
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id::text, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.cb_admins (id, account_id, name, email, phone, status)
    VALUES (v_user_id::text, p_account_id, p_name, p_email, p_phone, 'Active')
    ON CONFLICT (id) DO UPDATE
    SET account_id = EXCLUDED.account_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        status = 'Active';

    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_staff_member(
    p_email text,
    p_password text,
    p_name text,
    p_phone text,
    p_staff_id text,
    p_admin_id text,
    p_department text,
    p_referral_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin(auth.uid()::text) THEN
        RAISE EXCEPTION 'Only admins can create staff accounts';
    END IF;

    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at,
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
            false
        );
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id::text, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.cb_staff (
        id,
        staff_id,
        name,
        email,
        phone,
        status,
        created_by_admin_id,
        department,
        referral_code
    )
    VALUES (
        v_user_id::text,
        p_staff_id,
        p_name,
        p_email,
        p_phone,
        'Active',
        p_admin_id,
        p_department,
        p_referral_code
    )
    ON CONFLICT (id) DO UPDATE
    SET staff_id = EXCLUDED.staff_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        status = 'Active',
        created_by_admin_id = EXCLUDED.created_by_admin_id,
        department = EXCLUDED.department,
        referral_code = EXCLUDED.referral_code;

    RETURN v_user_id;
END;
$$;

DO $$
DECLARE
    v_owner_id uuid;
BEGIN
    SELECT id INTO v_owner_id
    FROM auth.users
    WHERE email = 'arkarnaung009@gmail.com';

    IF v_owner_id IS NULL THEN
        v_owner_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at,
            is_sso_user
        )
        VALUES (
            v_owner_id,
            'arkarnaung009@gmail.com',
            '$2a$10$C94rKwGREbwx9evBOnTud.O1CpB1/9AijjZrVf6PzXGMFzkJrqJL2',
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', 'System Owner', 'email', 'arkarnaung009@gmail.com', 'email_verified', true, 'phone_verified', false, 'sub', v_owner_id::text),
            'authenticated',
            'authenticated',
            now(),
            now(),
            false
        );
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_owner_id::text, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.cb_admins (id, account_id, name, email, phone, status)
    VALUES (v_owner_id::text, 'OWNER', 'System Owner', 'arkarnaung009@gmail.com', 'System', 'Active')
    ON CONFLICT (id) DO UPDATE
    SET account_id = EXCLUDED.account_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        status = 'Active';
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(text, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_admin_member(text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_staff_member(text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;
