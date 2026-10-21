CREATE OR REPLACE FUNCTION public.debug_auth(p_email text)
RETURNS json AS $$
DECLARE
  v_user json;
  v_ident json;
BEGIN
  SELECT row_to_json(u) INTO v_user FROM auth.users u WHERE u.email = p_email;
  SELECT row_to_json(i) INTO v_ident FROM auth.identities i WHERE i.provider_id = (v_user->>'id') OR i.identity_data->>'email' = p_email LIMIT 1;
  
  RETURN json_build_object('user', v_user, 'identity', v_ident);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
