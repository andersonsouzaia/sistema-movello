-- Create storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads (INSERT)
CREATE POLICY "Avatar Upload for Authenticated Users" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Policy to allow public viewing (SELECT)
CREATE POLICY "Avatar Public View" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update own avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Policy to allow users to delete their own uploads
CREATE POLICY "Users can delete own avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid() = owner);
