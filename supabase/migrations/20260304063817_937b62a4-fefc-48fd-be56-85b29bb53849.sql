
ALTER TABLE line_users ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE line_users ADD COLUMN staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE line_users ADD COLUMN status text DEFAULT 'unlinked';

-- Update existing linked records to have 'linked' status
UPDATE line_users SET status = 'linked' WHERE member_id IS NOT NULL;

-- Add RLS policy for managers to manage all LINE identity records
CREATE POLICY "Managers can manage all LINE identities"
ON line_users
FOR ALL
TO authenticated
USING (has_min_access_level(auth.uid(), 'level_3_manager'::access_level))
WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'::access_level));
