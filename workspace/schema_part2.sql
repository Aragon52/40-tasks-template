-- PART 2 OF 5: CORE ADMIN, STAFF & DEPOSIT SETTINGS TABLES
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
    profile_photo text,
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
