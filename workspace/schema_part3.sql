-- PART 3 OF 5: USER, TRANSACTION & ORDER TABLES
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
    status text DEFAULT 'Pending',
    remark text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cb_withdrawals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.cb_users(id) ON DELETE CASCADE,
    username text,
    amount numeric NOT NULL,
    method text,
    destination text,
    status text DEFAULT 'Pending',
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
    status text DEFAULT 'Pending',
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
