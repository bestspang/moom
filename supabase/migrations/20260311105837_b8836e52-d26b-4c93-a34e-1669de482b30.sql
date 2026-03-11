
-- B4: Create storage bucket for slip images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slip-images', 'slip-images', false);

-- RLS: Allow authenticated users to upload slip images
CREATE POLICY "Authenticated users can upload slips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'slip-images');

-- RLS: Allow users to read their own slip images
CREATE POLICY "Users can read slip images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'slip-images');

-- RLS: Allow admin to read all slip images
CREATE POLICY "Service role can manage all slips"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'slip-images');
