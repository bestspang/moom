
-- Step 1: Create the transfer_slip_status enum
CREATE TYPE transfer_slip_status AS ENUM ('needs_review', 'approved', 'rejected', 'voided');

-- Step 2: Create the transfer_slips table
CREATE TABLE transfer_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  slip_datetime timestamptz,
  member_id uuid REFERENCES members(id),
  member_name_text text,
  member_phone_text text,
  location_id uuid REFERENCES locations(id),
  amount_thb numeric NOT NULL DEFAULT 0,
  bank_reference text,
  payment_method payment_method DEFAULT 'bank_transfer',
  slip_file_url text,
  status transfer_slip_status DEFAULT 'needs_review',
  reviewer_staff_id uuid REFERENCES staff(id),
  reviewed_at timestamptz,
  review_note text,
  linked_transaction_id uuid REFERENCES transactions(id),
  package_id uuid REFERENCES packages(id),
  raw_import_row_json jsonb
);

-- Step 3: Create indexes
CREATE INDEX idx_transfer_slips_status ON transfer_slips(status);
CREATE INDEX idx_transfer_slips_datetime ON transfer_slips(slip_datetime);
CREATE INDEX idx_transfer_slips_amount ON transfer_slips(amount_thb);
CREATE INDEX idx_transfer_slips_linked_tx ON transfer_slips(linked_transaction_id);
CREATE INDEX idx_transfer_slips_member ON transfer_slips(member_id);

-- Step 4: Updated_at trigger
CREATE TRIGGER set_transfer_slips_updated_at
  BEFORE UPDATE ON transfer_slips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Step 5: Enable RLS
ALTER TABLE transfer_slips ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS policies
CREATE POLICY "Managers can read transfer slips"
  ON transfer_slips FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));

CREATE POLICY "Managers can insert transfer slips"
  ON transfer_slips FOR INSERT TO authenticated
  WITH CHECK (has_min_access_level(auth.uid(), 'level_3_manager'));

CREATE POLICY "Managers can update transfer slips"
  ON transfer_slips FOR UPDATE TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));

CREATE POLICY "Managers can delete transfer slips"
  ON transfer_slips FOR DELETE TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));
