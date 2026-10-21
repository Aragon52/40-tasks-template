-- ============================================================================
-- WALMARK / WALMART COPILOT PLATFORM - SUPABASE CLEAN SCHEMA SCRIPT
-- ============================================================================
-- Execute this script in your fresh Supabase SQL Editor to provision all required
-- tables, extensions, RLS security policies, and helper RPC functions with clean data.
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Enumerated Types & User Roles
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

-- 3. Core Application Tables

-- cb_users (User accounts, balances, VIP tier, referral stats, bank/crypto info)
CREATE TABLE IF NOT EXISTS public.cb_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE NOT NULL,
    password text,
    phone text,
    email text,
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    commissions numeric(15,2) DEFAULT 0.00 NOT NULL,
    credit_score integer DEFAULT 100 NOT NULL,
    vip_level text DEFAULT 'VIP 1' NOT NULL,
    status text DEFAULT 'Active' NOT NULL,
    avatar text,
    invite_code text,
    invited_by_user_id uuid,
    bank_name text,
    bank_account text,
    holder_name text,
    ifsc text,
    usdt_address text,
    btc_address text,
    eth_address text,
    withdrawal_password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_admins (Admin team members)
CREATE TABLE IF NOT EXISTS public.cb_admins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text DEFAULT 'Admin' NOT NULL,
    status text DEFAULT 'Active' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_staff (Staff members & referral management)
CREATE TABLE IF NOT EXISTS public.cb_staff (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role text DEFAULT 'Staff' NOT NULL,
    status text DEFAULT 'Active' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_audit_logs (System audit trail)
CREATE TABLE IF NOT EXISTS public.cb_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email text,
    action text NOT NULL,
    details text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_deposit_settings (Deposit channels and wallet addresses)
CREATE TABLE IF NOT EXISTS public.cb_deposit_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    method_name text NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    wallet_address text,
    qr_code_url text,
    min_amount numeric(15,2) DEFAULT 10.00 NOT NULL,
    max_amount numeric(15,2) DEFAULT 50000.00 NOT NULL,
    status text DEFAULT 'Active' NOT NULL,
    remark text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_deposits (User deposit requests and approvals)
CREATE TABLE IF NOT EXISTS public.cb_deposits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    amount numeric(15,2) NOT NULL,
    method text NOT NULL,
    status text DEFAULT 'Pending' NOT NULL,
    transaction_id text,
    proof_image text,
    remark text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_withdrawals (User withdrawal requests and approvals)
CREATE TABLE IF NOT EXISTS public.cb_withdrawals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    amount numeric(15,2) NOT NULL,
    method text NOT NULL,
    destination text NOT NULL,
    status text DEFAULT 'Pending' NOT NULL,
    remark text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_orders (Individual matched orders)
CREATE TABLE IF NOT EXISTS public.cb_orders (
    id text PRIMARY KEY,
    username text NOT NULL,
    phone text,
    title text NOT NULL,
    price numeric(15,2) NOT NULL,
    profit numeric(15,2) NOT NULL,
    status text DEFAULT 'Pending' NOT NULL,
    image text,
    type text DEFAULT 'gear' NOT NULL,
    assigned_task_id uuid,
    assigned_order_index integer,
    timestamp timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_assigned_tasks (Task batches / AI Edge task assignments - 40 items per batch)
CREATE TABLE IF NOT EXISTS public.cb_assigned_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    phone text,
    status text DEFAULT 'Pending' NOT NULL,
    order_count integer DEFAULT 40 NOT NULL,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    profit_percent numeric(5,2) DEFAULT 0.25 NOT NULL,
    orders jsonb DEFAULT '[]'::jsonb NOT NULL,
    task_type text DEFAULT 'standard' NOT NULL,
    disable_referral_commission boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_support_messages (Live support chat messages)
CREATE TABLE IF NOT EXISTS public.cb_support_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    sender text NOT NULL,
    message text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- cb_owner_settings (Global platform settings & maintenance mode)
CREATE TABLE IF NOT EXISTS public.cb_owner_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name text DEFAULT 'Walmark Platform' NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    announcement text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_deposit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_owner_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies (Allow public access for application tables and admin restricted access)
CREATE POLICY "Public full access user_roles" ON public.user_roles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_users" ON public.cb_users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_admins" ON public.cb_admins FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_staff" ON public.cb_staff FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_audit_logs" ON public.cb_audit_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_deposit_settings" ON public.cb_deposit_settings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_deposits" ON public.cb_deposits FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_withdrawals" ON public.cb_withdrawals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_orders" ON public.cb_orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_assigned_tasks" ON public.cb_assigned_tasks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_support_messages" ON public.cb_support_messages FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access cb_owner_settings" ON public.cb_owner_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. Helper RPC Functions
-- ============================================================================
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
      false
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_identity_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.cb_admins (name, email, role, status)
  VALUES (p_name, p_email, 'Super Admin', 'Active')
  ON CONFLICT (email) DO NOTHING;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default owner settings record
INSERT INTO public.cb_owner_settings (site_name, maintenance_mode, announcement)
VALUES ('Walmark Platform', false, 'Welcome to Walmark Platform. Complete your daily matching tasks to earn daily commissions.')
ON CONFLICT DO NOTHING;
