
-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-photos',
  'patient-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policy for bucket access
CREATE POLICY "Allow authenticated users to upload patient photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'patient'
);

CREATE POLICY "Allow authenticated users to view patient photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete patient photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-photos' 
  AND auth.role() = 'authenticated'
);

-- Add profile_photo_url column to patients table
ALTER TABLE public.patients 
ADD COLUMN profile_photo_url TEXT;

-- Create body_photos table
CREATE TABLE public.body_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_date DATE NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'side', 'back')),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for body_photos
CREATE INDEX idx_body_photos_patient_date ON public.body_photos(patient_id, photo_date DESC);

-- Enable RLS on body_photos
ALTER TABLE public.body_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for body_photos
CREATE POLICY "Allow all operations on body_photos" 
ON public.body_photos FOR ALL 
USING (true) WITH CHECK (true);

-- Create trigger for body_photos timestamp updates
CREATE TRIGGER update_body_photos_updated_at 
BEFORE UPDATE ON public.body_photos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
