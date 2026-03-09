CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_surface text;
  v_provider text;
BEGIN
  v_surface := NEW.raw_user_meta_data->>'signup_surface';
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Determine surface: explicit metadata takes priority.
  -- If no signup_surface set AND provider is NOT email, default to 'member'
  -- (admin staff are always invited via email or created manually)
  IF v_surface IS NULL THEN
    IF v_provider != 'email' THEN
      v_surface := 'member';
    ELSE
      v_surface := 'admin';
    END IF;
  END IF;

  IF v_surface = 'member' THEN
    -- Member signup: only create user_role, no staff record
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member');
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