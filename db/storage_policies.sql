-- Supabase Storage Policies for EverWear

-- 1. Create the clothing-images bucket if it doesn't exist
-- This needs to be done in the Supabase dashboard or via the API

-- 2. Set up policies for authenticated users to upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clothing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Set up policies for authenticated users to view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clothing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Set up policies for authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clothing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Note: These policies ensure that:
-- 1. Only authenticated users can upload, view, and delete images
-- 2. Users can only access (upload, view, delete) images in their own folder
-- 3. Images are organized by user ID in the storage structure