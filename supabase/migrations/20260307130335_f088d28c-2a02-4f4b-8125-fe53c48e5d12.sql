-- Add 'inactive' to staff_status enum
ALTER TYPE public.staff_status ADD VALUE IF NOT EXISTS 'inactive';

-- Update handle_new_user trigger to set OAuth signups as inactive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;