
# Update User Role to Owner

## Current Status
- **User**: bestspang@gmail.com
- **User ID**: `41ff3f12-55c8-4061-bd58-57ffebbd683a`
- **Current State**: User has signed up and logged in, but staff and user_roles records are missing (signup flow didn't create them due to RLS policies)

## Required Changes

### Database Migration
Execute the following SQL to set the user as owner:

```sql
-- Insert staff record for bestspang@gmail.com
INSERT INTO public.staff (user_id, first_name, last_name, email, status)
VALUES (
  '41ff3f12-55c8-4061-bd58-57ffebbd683a',
  'Best',
  'Spang',
  'bestspang@gmail.com',
  'active'
)
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

-- Insert user_roles record with 'owner' role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '41ff3f12-55c8-4061-bd58-57ffebbd683a',
  'owner'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

## Result After Implementation
- User will have `owner` role (Level 4: Master access)
- Full access to all menu items including Roles management
- Can manage all aspects of the system

## Additional Fix Needed
The signup flow in `AuthContext.tsx` is not creating staff/user_roles records properly. This needs to be investigated - likely the RLS policies are blocking the inserts. We should either:
1. Use a server-side function (edge function) to create these records
2. Or adjust RLS policies to allow inserts during signup
