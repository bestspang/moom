
-- 1. Make slip-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'slip-images';

-- 2. Drop public squad_memberships read policy (authenticated policy already exists)
DROP POLICY IF EXISTS "Anyone can read squad memberships" ON public.squad_memberships;

-- 3. line_users: prevent member_id hijack via trigger
CREATE OR REPLACE FUNCTION public.prevent_line_users_member_id_hijack()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Managers/admins bypass the check
  IF has_min_access_level(auth.uid(), 'level_3_manager'::access_level) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.member_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot set member_id directly; linking requires verified flow'
        USING ERRCODE = '42501';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.member_id IS DISTINCT FROM OLD.member_id THEN
      RAISE EXCEPTION 'Cannot change member_id; linking requires verified flow'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.staff_id IS DISTINCT FROM OLD.staff_id THEN
      RAISE EXCEPTION 'Cannot change staff_id; linking requires verified flow'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
      RAISE EXCEPTION 'Cannot change lead_id; linking requires verified flow'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_line_users_member_id_hijack ON public.line_users;
CREATE TRIGGER trg_prevent_line_users_member_id_hijack
  BEFORE INSERT OR UPDATE ON public.line_users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_line_users_member_id_hijack();

-- 4. Tighten get_my_member_id fallback: only trust verified-linked line_users rows
CREATE OR REPLACE FUNCTION public.get_my_member_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT admin_entity_id FROM identity_map
     WHERE experience_user_id = _user_id AND entity_type = 'member' AND is_verified = true
     LIMIT 1),
    (SELECT member_id FROM line_users
     WHERE user_id = _user_id
       AND member_id IS NOT NULL
       AND status = 'linked'
     LIMIT 1)
  )
$$;
