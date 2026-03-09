
-- Add freelance_trainer to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'freelance_trainer';

-- Update handle_new_user to create members + identity_map for member signups
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
  -- If no signup_surface set AND provider is NOT email, default to 'member'
  IF v_surface IS NULL THEN
    IF v_provider != 'email' THEN
      v_surface := 'member';
    ELSE
      v_surface := 'admin';
    END IF;
  END IF;

  IF v_surface = 'member' THEN
    -- Generate a unique member_id code (M-XXXXXXXX)
    v_member_code := 'M-' || lpad(floor(random() * 100000000)::text, 8, '0');

    -- Create user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member');

    -- Create members record
    INSERT INTO public.members (first_name, last_name, member_id, email, status, source)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Member'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
      v_member_code,
      NEW.email,
      'active',
      'self_signup'
    ) RETURNING id INTO v_member_id;

    -- Create identity_map linking auth user → member
    INSERT INTO public.identity_map (
      admin_entity_id, experience_user_id, entity_type,
      shared_identifier, shared_identifier_type, is_verified
    ) VALUES (
      v_member_id, NEW.id, 'member',
      NEW.email, 'email', true
    );
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

-- Update has_min_access_level to handle freelance_trainer
CREATE OR REPLACE FUNCTION public.has_min_access_level(_user_id uuid, _min_level access_level)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_level access_level;
  level_order jsonb := '{"level_1_minimum": 1, "level_2_operator": 2, "level_3_manager": 3, "level_4_master": 4}'::jsonb;
BEGIN
  SELECT 
    CASE ur.role
      WHEN 'member' THEN 'level_1_minimum'::access_level
      WHEN 'front_desk' THEN 'level_1_minimum'::access_level
      WHEN 'trainer' THEN 'level_2_operator'::access_level
      WHEN 'freelance_trainer' THEN 'level_2_operator'::access_level
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 6
      WHEN 'admin' THEN 5
      WHEN 'trainer' THEN 4
      WHEN 'freelance_trainer' THEN 3
      WHEN 'front_desk' THEN 2
      WHEN 'member' THEN 1
    END DESC
  LIMIT 1;
  
  IF user_level IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (level_order->>user_level::text)::int >= (level_order->>_min_level::text)::int;
END;
$function$;

-- Update get_user_access_level to handle freelance_trainer
CREATE OR REPLACE FUNCTION public.get_user_access_level(_user_id uuid)
RETURNS access_level
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_level access_level;
BEGIN
  SELECT 
    CASE ur.role
      WHEN 'member' THEN 'level_1_minimum'::access_level
      WHEN 'front_desk' THEN 'level_1_minimum'::access_level
      WHEN 'trainer' THEN 'level_2_operator'::access_level
      WHEN 'freelance_trainer' THEN 'level_2_operator'::access_level
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 6
      WHEN 'admin' THEN 5
      WHEN 'trainer' THEN 4
      WHEN 'freelance_trainer' THEN 3
      WHEN 'front_desk' THEN 2
      WHEN 'member' THEN 1
    END DESC
  LIMIT 1;
  
  RETURN COALESCE(user_level, 'level_1_minimum'::access_level);
END;
$function$;
