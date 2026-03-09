
-- Replace handle_new_user to be surface-aware
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_surface text;
BEGIN
  v_surface := COALESCE(NEW.raw_user_meta_data->>'signup_surface', 'admin');

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
        WHEN NEW.raw_app_meta_data->>'provider' = 'email' THEN 'pending'
        ELSE 'inactive'
      END
    );
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'front_desk');
  END IF;

  RETURN NEW;
END;
$function$;
