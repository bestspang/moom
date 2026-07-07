-- Scope slip-images uploads to the caller's own member folder.
--
-- The previous INSERT policy allowed any authenticated user to write (or overwrite)
-- any object path in the slip-images bucket, so a member could spray files or plant
-- objects under paths another member's transfer_slips row references. Uploads now go to
-- slips/<member_id>/<file> (see uploadTransferSlip), and this policy requires the second
-- path segment to be the caller's own member id. Staff may still write anywhere.

DROP POLICY IF EXISTS "Authenticated users can upload slips" ON storage.objects;

CREATE POLICY "Members upload slips to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'slip-images'
    AND (
      public.is_staff(auth.uid())
      OR (
        (storage.foldername(name))[1] = 'slips'
        AND (storage.foldername(name))[2] = public.get_my_member_id(auth.uid())::text
      )
    )
  );
