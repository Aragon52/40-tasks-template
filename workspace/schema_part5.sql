-- PART 5 OF 5: ACCOUNT CREATION FUNCTIONS & INITIAL SYSTEM SEEDING
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

-- Seed System Owner
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
