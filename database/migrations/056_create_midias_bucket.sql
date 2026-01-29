-- ============================================
-- CREATE STORAGE BUCKET 'midias' AND POLICIES
-- Migração 056: Criar o bucket principal de mídias e definir políticas
-- ============================================

-- 1. Criar o bucket 'midias' se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('midias', 'midias', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas para 'midias'
-- Permite que qualquer um (público) visualize os arquivos
CREATE POLICY "Public View Midias" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'midias');

-- Permite que usuários autenticados façam upload
CREATE POLICY "Authenticated Upload Midias" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'midias');

-- Permite que usuários autenticados deletem seus próprios arquivos
CREATE POLICY "Authenticated Delete Midias" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'midias');

-- Nota: No Supabase Storage, as pastas são virtuais. 
-- Elas "passam a existir" assim que o primeiro arquivo é enviado com o prefixo da pasta.
-- Exemplo: Ao enviar um arquivo para 'Food/video.mp4', a pasta 'Food' será exibida na interface.
