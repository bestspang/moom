
-- P1-2: Tighten slip-images SELECT policy.
-- Before: anyone (anon) could list/enumerate every slip URL.
-- After: only staff (level_1+) or the slip's owner-member can SELECT/list.
-- Public bucket flag remains true so signed URLs in admin/member UI keep working.

DROP POLICY IF EXISTS "Users can read slip images" ON storage.objects;

CREATE POLICY "Slip images readable by staff or owner"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'slip-images'
    AND (
      -- Staff (front-desk and above) can list/read all slip images
      public.has_min_access_level(auth.uid(), 'level_1_minimum'::access_level)
      -- OR the requesting member owns the slip
      OR EXISTS (
        SELECT 1
        FROM public.transfer_slips ts
        WHERE ts.slip_file_url LIKE '%' || storage.objects.name
          AND ts.member_id = public.get_my_member_id(auth.uid())
      )
    )
  );
