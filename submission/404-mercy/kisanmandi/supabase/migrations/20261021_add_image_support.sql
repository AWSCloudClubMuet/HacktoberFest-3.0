-- Migration: Add image support to crops and listings & configure Supabase Storage
-- Team 404 MERCY | KisanMandi

-- 1. Add image_url to crops table
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add image_url to listings table (for seller-uploaded actual produce photos)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Update existing crops with reference image paths
UPDATE public.crops SET image_url = '/images/crops/wheat.jpg' WHERE id = 'c1';
UPDATE public.crops SET image_url = '/images/crops/rice.jpg' WHERE id = 'c2';
UPDATE public.crops SET image_url = '/images/crops/cotton.jpg' WHERE id = 'c3';
UPDATE public.crops SET image_url = '/images/crops/sugarcane.jpg' WHERE id = 'c4';
UPDATE public.crops SET image_url = '/images/crops/onion.jpg' WHERE id = 'c5';
UPDATE public.crops SET image_url = '/images/crops/tomato.jpg' WHERE id = 'c6';
UPDATE public.crops SET image_url = '/images/crops/mango.jpg' WHERE id = 'c7';
UPDATE public.crops SET image_url = '/images/crops/banana.jpg' WHERE id = 'c8';

-- 4. Create public Supabase Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 5. Storage Access Policies
-- A. Public read access for all product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read access for product images'
  ) THEN
    CREATE POLICY "Public read access for product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- B. Authenticated users can upload photos into their user-specific folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload product photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload product photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- C. Users can update their own uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own product photos'
  ) THEN
    CREATE POLICY "Users can update their own product photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- D. Users can delete their own uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own product photos'
  ) THEN
    CREATE POLICY "Users can delete their own product photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

