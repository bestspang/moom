-- B1: Make slip-images bucket public so getPublicUrl() works
UPDATE storage.buckets SET public = true WHERE id = 'slip-images';