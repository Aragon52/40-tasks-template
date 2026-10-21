-- 1. Fix the create_admin_member function to be fully compatible with Supabase Auth (GoTrue)
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


-- 2. Fix the create_staff_member function to be fully compatible with Supabase Auth (GoTrue)
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


-- 3. Fix all existing accounts that were broken by the old buggy RPCs
DO $$
DECLARE
  v_rec RECORD;
  v_new_id uuid;
BEGIN
  -- A. Ensure is_sso_user is false for email users
  UPDATE auth.users
  SET is_sso_user = false
  WHERE is_sso_user IS NULL;

  -- B. Repair broken auth.identities where the id was set to user_id
  FOR v_rec IN 
    SELECT * FROM auth.identities 
    WHERE id::text = user_id::text
  LOOP
    v_new_id := gen_random_uuid();
    
    -- Delete the duplicate/erroneous identity record
    DELETE FROM auth.identities WHERE id = v_rec.id;
    
    -- Re-insert with a valid, distinct random identity UUID
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      v_new_id,
      v_rec.user_id,
      v_rec.identity_data,
      v_rec.provider,
      v_rec.provider_id,
      v_rec.last_sign_in_at,
      v_rec.created_at,
      v_rec.updated_at
    );
  END LOOP;
END;
$$;


-- 4. Dynamically find the foreign key constraint on cb_staff that points to cb_admins,
--    and alter it to ON DELETE SET NULL, so administrators can be deleted even if they created staff.
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- Fetch the constraint name linking public.cb_staff (source) to public.cb_admins (target)
  SELECT c.conname INTO v_constraint_name
  FROM pg_constraint c
  JOIN pg_namespace n ON n.oid = c.connamespace
  WHERE c.contype = 'f'
    AND c.conrelid = 'public.cb_staff'::regclass
    AND c.confrelid = 'public.cb_admins'::regclass;

  IF v_constraint_name IS NOT NULL THEN
    -- Drop existing strict foreign key constraint
    EXECUTE 'ALTER TABLE public.cb_staff DROP CONSTRAINT ' || quote_ident(v_constraint_name);
    
    -- Re-add the foreign key constraint with ON DELETE SET NULL
    EXECUTE 'ALTER TABLE public.cb_staff ADD CONSTRAINT ' || quote_ident(v_constraint_name) || 
            ' FOREIGN KEY (created_by_admin_id) REFERENCES public.cb_admins(account_id) ON DELETE SET NULL';
  END IF;
END;
$$;

-- 5. Helper functions for raw inspections
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
