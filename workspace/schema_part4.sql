-- PART 4 OF 5: SUPPORT CHAT, STORAGE & SECURITY POLICIES (RLS)
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
    sender text NOT NULL,
    content text,
    image_url text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
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

-- Security Policies
DROP POLICY IF EXISTS "Admins manage admins" ON public.cb_admins;
CREATE POLICY "Admins manage admins" ON public.cb_admins FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage staff" ON public.cb_staff;
DROP POLICY IF EXISTS "Public select active staff" ON public.cb_staff;
CREATE POLICY "Admins manage staff" ON public.cb_staff FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Public select active staff" ON public.cb_staff FOR SELECT TO public USING (status = 'Active');

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

-- Storage Bucket & Storage Policies
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
