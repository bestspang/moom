

# Insert 3 Fake Check-ins for Testing

## What
Insert 3 `member_attendance` rows for member `1509a8c5-4268-4e12-9c22-caf81f6d611c` (Kongphop) at location `be0ba4a4-76fa-4f8f-96df-c4510dcf5621`, spread across the last few hours today.

## How
One database migration with 3 INSERT statements:

```sql
INSERT INTO member_attendance (member_id, location_id, check_in_time, check_in_type, checkin_method)
VALUES
  ('1509a8c5-...', 'be0ba4a4-...', now() - interval '3 hours', 'walk_in', 'manual'),
  ('1509a8c5-...', 'be0ba4a4-...', now() - interval '2 hours', 'walk_in', 'manual'),
  ('1509a8c5-...', 'be0ba4a4-...', now() - interval '1 hour',  'walk_in', 'manual');
```

No code changes needed — data-only migration.

