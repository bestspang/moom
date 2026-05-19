
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

CREATE POLICY "Managers can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level)
);

CREATE POLICY "Managers can update brand assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-assets'
  AND public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level)
);

CREATE POLICY "Managers can delete brand assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-assets'
  AND public.has_min_access_level(auth.uid(), 'level_3_manager'::access_level)
);
