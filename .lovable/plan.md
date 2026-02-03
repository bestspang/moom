

# Security Remediation Plan for MOOM CLUB

## Overview
This plan addresses 21 security findings including 9 critical vulnerabilities that expose customer personal data, financial records, and health information to unauthorized access.

## Phase 1: CRITICAL - Fix Public Data Exposure (Immediate)

### 1.1 Update RLS Policies for Sensitive Tables

Replace `USING (true)` SELECT policies with proper authentication checks:

**Tables to fix:**
- `members` - Customer PII
- `staff` - Employee data  
- `leads` - Sales pipeline
- `member_billing` - Financial records
- `transactions` - Payment data
- `member_contracts` - Legal documents
- `member_injuries` - Health info
- `member_notes` - Private notes
- `member_suspensions` - Disciplinary records

**New policy pattern:**
```sql
-- Replace "USING (true)" with authentication check
DROP POLICY IF EXISTS "Staff can read members" ON members;
CREATE POLICY "Authenticated staff can read members" ON members
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Or for stricter access:
CREATE POLICY "Operators can read members" ON members
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_1_minimum'));
```

### 1.2 Fix INSERT Policies

Replace `WITH CHECK (true)` with proper access checks:

**Tables to fix:**
- `activity_log` - System can insert → restrict to service role
- `member_attendance` - Staff can record → require min access level
- `member_notes` - All staff can manage → require staff verification
- `notifications` - System can insert → restrict to service role

**Example fix:**
```sql
DROP POLICY IF EXISTS "Staff can record attendance" ON member_attendance;
CREATE POLICY "Staff can record attendance" ON member_attendance
  FOR INSERT
  WITH CHECK (has_min_access_level(auth.uid(), 'level_1_minimum'));
```

---

## Phase 2: HIGH - Fix Authentication Flow

### 2.1 Server-Side User Provisioning

Create an edge function to handle signup instead of client-side inserts:

**File: `supabase/functions/create-user-profile/index.ts`**

```typescript
// Edge function to create staff and user_roles records
// Called after successful signup via database trigger or webhook
// Uses service role to bypass RLS
```

### 2.2 Database Trigger for User Creation

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create staff record
  INSERT INTO public.staff (user_id, email, first_name, last_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'pending'
  );
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'front_desk');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Phase 3: MEDIUM - Strengthen Authentication

### 3.1 Enable Leaked Password Protection

Update Supabase Auth settings to enable HaveIBeenPwned check.

### 3.2 Strengthen Password Policy

Update signup validation schema:
```typescript
const signupSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});
```

### 3.3 Fix Function Search Paths

Update all database functions to set explicit search_path:
```sql
CREATE OR REPLACE FUNCTION has_min_access_level(...)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Add this line
AS $$
...
$$;
```

---

## Phase 4: LOW - Tighten Access Controls

### 4.1 Restrict Activity Log Access
```sql
DROP POLICY IF EXISTS "Operators can read activity log" ON activity_log;
CREATE POLICY "Managers can read activity log" ON activity_log
  FOR SELECT
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));
```

### 4.2 Restrict Member Packages
```sql
DROP POLICY IF EXISTS "All can read member packages" ON member_packages;
CREATE POLICY "Authenticated staff can read member packages" ON member_packages
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## Implementation Order

1. **Immediate (Today)**: Phase 1.1 - Fix SELECT policies on sensitive tables
2. **Urgent (This Week)**: Phase 1.2 + Phase 2 - Fix INSERT policies + auth flow
3. **Soon (Next Week)**: Phase 3 - Password hardening + leaked password protection
4. **Follow-up**: Phase 4 - Fine-tune access controls

---

## SQL Migration Summary

The complete migration will:
1. Drop 15+ overly permissive RLS policies
2. Create 15+ secure replacement policies
3. Create database trigger for user provisioning
4. Fix function search paths

---

## Verification Steps

After implementation:
1. Test unauthenticated access is denied (should get 401/403)
2. Test authenticated staff can read appropriate data
3. Test RBAC levels work correctly
4. Verify signup creates staff/role records automatically
5. Confirm no console errors in application

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | 30+ policy changes |
| `src/contexts/AuthContext.tsx` | Remove client-side staff/role inserts |
| `src/pages/Auth/Signup.tsx` | Update password validation |
| New edge function | User provisioning (optional) |

