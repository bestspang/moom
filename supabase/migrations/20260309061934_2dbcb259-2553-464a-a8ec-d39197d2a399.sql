
-- Update handle_new_user to detect existing legacy members by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_surface text;
  v_provider text;
  v_member_id uuid;
  v_member_code text;
BEGIN
  v_surface := NEW.raw_user_meta_data->>'signup_surface';
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Determine surface: explicit metadata takes priority.
  IF v_surface IS NULL THEN
    IF v_provider != 'email' THEN
      v_surface := 'member';
    ELSE
      v_surface := 'admin';
    END IF;
  END IF;

  IF v_surface = 'member' THEN
    -- Check for existing member with same email (legacy account claiming)
    SELECT id INTO v_member_id FROM public.members WHERE email = NEW.email LIMIT 1;

    IF v_member_id IS NOT NULL THEN
      -- Legacy claim: link auth user to existing member record
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'member');

      INSERT INTO public.identity_map (
        admin_entity_id, experience_user_id, entity_type,
        shared_identifier, shared_identifier_type, is_verified
      ) VALUES (
        v_member_id, NEW.id, 'member',
        NEW.email, 'email', true
      );
    ELSE
      -- New member: create members row + identity_map
      v_member_code := 'M-' || lpad(floor(random() * 100000000)::text, 8, '0');

      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'member');

      INSERT INTO public.members (first_name, last_name, member_id, email, status, source)
      VALUES (
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Member'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
        v_member_code,
        NEW.email,
        'active',
        'self_signup'
      ) RETURNING id INTO v_member_id;

      INSERT INTO public.identity_map (
        admin_entity_id, experience_user_id, entity_type,
        shared_identifier, shared_identifier_type, is_verified
      ) VALUES (
        v_member_id, NEW.id, 'member',
        NEW.email, 'email', true
      );
    END IF;
  ELSE
    -- Admin/staff signup: existing behavior
    INSERT INTO public.staff (user_id, email, first_name, last_name, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      CASE
        WHEN v_provider = 'email' THEN 'pending'
        ELSE 'inactive'
      END
    );
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'front_desk');
  END IF;

  RETURN NEW;
END;
$function$;
