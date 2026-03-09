
-- Update has_min_access_level to handle member role
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
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 5
      WHEN 'admin' THEN 4
      WHEN 'trainer' THEN 3
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

-- Update get_user_access_level to handle member role
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
      WHEN 'admin' THEN 'level_3_manager'::access_level
      WHEN 'owner' THEN 'level_4_master'::access_level
    END INTO user_level
  FROM user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 5
      WHEN 'admin' THEN 4
      WHEN 'trainer' THEN 3
      WHEN 'front_desk' THEN 2
      WHEN 'member' THEN 1
    END DESC
  LIMIT 1;
  
  RETURN COALESCE(user_level, 'level_1_minimum'::access_level);
END;
$function$;
