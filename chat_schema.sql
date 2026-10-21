-- 1. Create the support sessions table
CREATE TABLE IF NOT EXISTS public.cb_support_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.cb_users(id),
  user_username text,
  is_online boolean DEFAULT false,
  unread_admin_count integer DEFAULT 0,
  unread_user_count integer DEFAULT 0,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create the support messages table
CREATE TABLE IF NOT EXISTS public.cb_support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.cb_support_sessions(id) ON DELETE CASCADE,
  sender text NOT NULL, -- 'user' or 'admin'
  content text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.cb_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_support_messages ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies

-- Ensure admins can see and manage all sessions and messages
CREATE POLICY "Admins manage all sessions" ON public.cb_support_sessions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage all messages" ON public.cb_support_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Users can see and manage their own sessions and messages (using public access since user-portal uses anon key)
CREATE POLICY "Public manage sessions" ON public.cb_support_sessions
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public manage messages" ON public.cb_support_messages
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- 5. Enable Realtime for the tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cb_support_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cb_support_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cb_support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cb_support_messages;
  END IF;
END
$$;
