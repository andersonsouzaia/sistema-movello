-- Create storage bucket for campaigns if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campanha_midias', 'campanha_midias', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads (INSERT)
CREATE POLICY "Public Upload for Authenticated Users" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'campanha_midias');

-- Policy to allow public viewing (SELECT)
CREATE POLICY "Public View" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'campanha_midias');

-- Policy to allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'campanha_midias' AND auth.uid() = owner);
