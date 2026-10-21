-- 1. Add image_url to chat messages
ALTER TABLE public.cb_support_messages ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Create the Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cb_storage', 'cb_storage', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies

-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cb_storage' );

-- Allow ANYONE to upload images (since user portal uses anon key)
CREATE POLICY "Public can upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'cb_storage' );

-- Allow ANYONE to update images
CREATE POLICY "Public can update"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'cb_storage' )
WITH CHECK ( bucket_id = 'cb_storage' );

-- Allow ANYONE to delete images
CREATE POLICY "Public can delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'cb_storage' );
