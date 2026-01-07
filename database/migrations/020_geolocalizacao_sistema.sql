-- ============================================
-- SISTEMA DE GEOLOCALIZAÇÃO E SEGMENTAÇÃO AVANÇADA
-- Migração 020: Sistema completo de geolocalização, nicho, segmentação e objetivos
-- Data: 2024
-- ============================================

-- ============================================
-- 1. ADICIONAR CAMPOS DE GEOLOCALIZAÇÃO EM CAMPANHAS
-- ============================================

-- Campos de geolocalização
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS localizacao_tipo VARCHAR(50) CHECK (
    localizacao_tipo IN ('raio', 'poligono', 'cidade', 'estado', 'regiao')
);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS raio_km DECIMAL(10, 2);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS centro_latitude DECIMAL(10, 8);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS centro_longitude DECIMAL(10, 8);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS poligono_coordenadas JSONB;

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS cidades TEXT[];

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS estados TEXT[];

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS regioes TEXT[];

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS areas_especificas JSONB;

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS excluir_areas JSONB;

-- Campos de nicho e categorias
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS nicho VARCHAR(100);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS categorias TEXT[];

-- Campos de público-alvo
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS publico_alvo JSONB;

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS horarios_exibicao JSONB;

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS dias_semana INTEGER[];

-- Campos de objetivos e KPIs
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS objetivo_principal VARCHAR(50) CHECK (
    objetivo_principal IN ('awareness', 'consideracao', 'conversao', 'retencao', 'engajamento')
);

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS objetivos_secundarios TEXT[];

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS kpis_meta JSONB;

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS estrategia VARCHAR(100) CHECK (
    estrategia IN ('cpc', 'cpm', 'cpa', 'cpl')
);

-- ============================================
-- 2. CRIAR TABELA DE ÁREAS FAVORITAS
-- ============================================

CREATE TABLE IF NOT EXISTS areas_favoritas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    localizacao_tipo VARCHAR(50) NOT NULL CHECK (
        localizacao_tipo IN ('raio', 'poligono', 'cidade', 'estado', 'regiao')
    ),
    raio_km DECIMAL(10, 2),
    centro_latitude DECIMAL(10, 8),
    centro_longitude DECIMAL(10, 8),
    poligono_coordenadas JSONB,
    cidades TEXT[],
    estados TEXT[],
    regioes TEXT[],
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, nome)
);

-- ============================================
-- 3. CRIAR TABELA DE TEMPLATES DE CAMPANHA
-- ============================================

CREATE TABLE IF NOT EXISTS campanha_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    nicho VARCHAR(100),
    categorias TEXT[],
    publico_alvo JSONB,
    horarios_exibicao JSONB,
    dias_semana INTEGER[],
    objetivo_principal VARCHAR(50),
    objetivos_secundarios TEXT[],
    estrategia VARCHAR(100),
    localizacao_tipo VARCHAR(50),
    raio_km DECIMAL(10, 2),
    centro_latitude DECIMAL(10, 8),
    centro_longitude DECIMAL(10, 8),
    poligono_coordenadas JSONB,
    cidades TEXT[],
    estados TEXT[],
    regioes TEXT[],
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CRIAR TABELA DE CATEGORIAS POR NICHO
-- ============================================

CREATE TABLE IF NOT EXISTS nicho_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nicho VARCHAR(100) NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    descricao TEXT,
    icone VARCHAR(100),
    ordem INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nicho, categoria)
);

-- Inserir categorias padrão por nicho
INSERT INTO nicho_categorias (nicho, categoria, descricao, ordem) VALUES
    ('alimentacao', 'restaurantes', 'Restaurantes e lanchonetes', 1),
    ('alimentacao', 'delivery', 'Serviços de delivery', 2),
    ('alimentacao', 'fast-food', 'Fast food e redes', 3),
    ('alimentacao', 'bebidas', 'Bebidas e drinks', 4),
    ('moda', 'roupas', 'Roupas e vestuário', 1),
    ('moda', 'acessorios', 'Acessórios', 2),
    ('moda', 'calcados', 'Calçados', 3),
    ('moda', 'joias', 'Joias e relógios', 4),
    ('tecnologia', 'apps', 'Aplicativos móveis', 1),
    ('tecnologia', 'software', 'Software e sistemas', 2),
    ('tecnologia', 'hardware', 'Hardware e equipamentos', 3),
    ('tecnologia', 'eletronicos', 'Eletrônicos', 4),
    ('saude', 'clinicas', 'Clínicas e consultórios', 1),
    ('saude', 'farmacias', 'Farmácias', 2),
    ('saude', 'academias', 'Academias e fitness', 3),
    ('saude', 'bem-estar', 'Bem-estar e spa', 4),
    ('beleza', 'saloes', 'Salões de beleza', 1),
    ('beleza', 'estetica', 'Estética e tratamentos', 2),
    ('beleza', 'cosmeticos', 'Cosméticos e produtos', 3),
    ('educacao', 'cursos', 'Cursos e treinamentos', 1),
    ('educacao', 'escolas', 'Escolas e faculdades', 2),
    ('educacao', 'online', 'Educação online', 3),
    ('entretenimento', 'cinema', 'Cinema e filmes', 1),
    ('entretenimento', 'shows', 'Shows e eventos', 2),
    ('entretenimento', 'jogos', 'Jogos e diversão', 3),
    ('servicos', 'consultoria', 'Consultoria', 1),
    ('servicos', 'limpeza', 'Limpeza e manutenção', 2),
    ('servicos', 'reparos', 'Reparos e consertos', 3),
    ('varejo', 'lojas', 'Lojas físicas', 1),
    ('varejo', 'e-commerce', 'E-commerce', 2),
    ('varejo', 'shopping', 'Shopping centers', 3)
ON CONFLICT (nicho, categoria) DO NOTHING;

-- ============================================
-- 5. CRIAR ÍNDICES
-- ============================================

-- Índices para campanhas
CREATE INDEX IF NOT EXISTS idx_campanhas_nicho ON campanhas (nicho);
CREATE INDEX IF NOT EXISTS idx_campanhas_objetivo ON campanhas (objetivo_principal);
CREATE INDEX IF NOT EXISTS idx_campanhas_estrategia ON campanhas (estrategia);
CREATE INDEX IF NOT EXISTS idx_campanhas_localizacao_tipo ON campanhas (localizacao_tipo);
CREATE INDEX IF NOT EXISTS idx_campanhas_cidades ON campanhas USING GIN (cidades);
CREATE INDEX IF NOT EXISTS idx_campanhas_estados ON campanhas USING GIN (estados);
CREATE INDEX IF NOT EXISTS idx_campanhas_categorias ON campanhas USING GIN (categorias);

-- Índices para áreas favoritas
CREATE INDEX IF NOT EXISTS idx_areas_favoritas_empresa ON areas_favoritas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_areas_favoritas_nome ON areas_favoritas (nome);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_campanha_templates_empresa ON campanha_templates (empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanha_templates_nicho ON campanha_templates (nicho);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_nicho_categorias_nicho ON nicho_categorias (nicho);

-- ============================================
-- 6. FUNÇÕES SQL PARA CÁLCULOS GEOGRÁFICOS
-- ============================================

-- Função para calcular distância entre dois pontos (Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia_geo(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    R DECIMAL := 6371; -- Raio da Terra em km
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Converter graus para radianos
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    
    -- Fórmula de Haversine
    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$;

-- Função para verificar se ponto está em raio
CREATE OR REPLACE FUNCTION verificar_ponto_em_raio(
    p_lat DECIMAL,
    p_lng DECIMAL,
    centro_lat DECIMAL,
    centro_lng DECIMAL,
    raio_km DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    distancia DECIMAL;
BEGIN
    distancia := calcular_distancia_geo(p_lat, p_lng, centro_lat, centro_lng);
    RETURN distancia <= raio_km;
END;
$$;

-- Função para buscar campanhas ativas por localização
CREATE OR REPLACE FUNCTION get_campanhas_por_localizacao(
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS TABLE (
    campanha_id UUID,
    titulo VARCHAR,
    empresa_id UUID,
    distancia_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.titulo,
        c.empresa_id,
        calcular_distancia_geo(p_lat, p_lng, c.centro_latitude, c.centro_longitude) AS distancia_km
    FROM campanhas c
    WHERE 
        c.status = 'ativa'
        AND c.localizacao_tipo = 'raio'
        AND c.centro_latitude IS NOT NULL
        AND c.centro_longitude IS NOT NULL
        AND c.raio_km IS NOT NULL
        AND verificar_ponto_em_raio(p_lat, p_lng, c.centro_latitude, c.centro_longitude, c.raio_km)
    ORDER BY distancia_km;
END;
$$;

-- ============================================
-- 7. RLS POLICIES PARA NOVAS TABELAS
-- ============================================

-- RLS para areas_favoritas
ALTER TABLE areas_favoritas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver suas áreas favoritas"
    ON areas_favoritas FOR SELECT
    TO authenticated
    USING (empresa_id = auth.uid());

CREATE POLICY "Empresas podem criar áreas favoritas"
    ON areas_favoritas FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = auth.uid());

CREATE POLICY "Empresas podem atualizar suas áreas favoritas"
    ON areas_favoritas FOR UPDATE
    TO authenticated
    USING (empresa_id = auth.uid())
    WITH CHECK (empresa_id = auth.uid());

CREATE POLICY "Empresas podem deletar suas áreas favoritas"
    ON areas_favoritas FOR DELETE
    TO authenticated
    USING (empresa_id = auth.uid());

-- RLS para campanha_templates
ALTER TABLE campanha_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus templates"
    ON campanha_templates FOR SELECT
    TO authenticated
    USING (empresa_id = auth.uid() OR empresa_id IS NULL);

CREATE POLICY "Empresas podem criar templates"
    ON campanha_templates FOR INSERT
    TO authenticated
    WITH CHECK (empresa_id = auth.uid() OR empresa_id IS NULL);

CREATE POLICY "Empresas podem atualizar seus templates"
    ON campanha_templates FOR UPDATE
    TO authenticated
    USING (empresa_id = auth.uid())
    WITH CHECK (empresa_id = auth.uid());

CREATE POLICY "Empresas podem deletar seus templates"
    ON campanha_templates FOR DELETE
    TO authenticated
    USING (empresa_id = auth.uid());

-- RLS para nicho_categorias (público, todos podem ler)
ALTER TABLE nicho_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver categorias"
    ON nicho_categorias FOR SELECT
    TO authenticated, anon
    USING (true);

-- ============================================
-- 8. TRIGGERS PARA updated_at
-- ============================================

CREATE TRIGGER update_areas_favoritas_updated_at
    BEFORE UPDATE ON areas_favoritas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanha_templates_updated_at
    BEFORE UPDATE ON campanha_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON areas_favoritas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campanha_templates TO authenticated;
GRANT SELECT ON nicho_categorias TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calcular_distancia_geo TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verificar_ponto_em_raio TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_campanhas_por_localizacao TO authenticated, anon;

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN campanhas.localizacao_tipo IS 'Tipo de localização: raio, poligono, cidade, estado, regiao';
COMMENT ON COLUMN campanhas.raio_km IS 'Raio em km quando localizacao_tipo = raio';
COMMENT ON COLUMN campanhas.centro_latitude IS 'Latitude do centro quando tipo = raio ou poligono';
COMMENT ON COLUMN campanhas.centro_longitude IS 'Longitude do centro quando tipo = raio ou poligono';
COMMENT ON COLUMN campanhas.poligono_coordenadas IS 'Array de coordenadas [[lat,lng],...] quando tipo = poligono';
COMMENT ON COLUMN campanhas.nicho IS 'Nicho principal da campanha';
COMMENT ON COLUMN campanhas.publico_alvo IS 'JSONB com {idade_min, idade_max, genero[], interesses[]}';
COMMENT ON COLUMN campanhas.horarios_exibicao IS 'JSONB com {dia: {inicio, fim}}';
COMMENT ON COLUMN campanhas.objetivo_principal IS 'Objetivo principal: awareness, consideracao, conversao, retencao, engajamento';
COMMENT ON COLUMN campanhas.kpis_meta IS 'JSONB com metas de KPIs {visualizacoes, cliques, conversoes}';
COMMENT ON COLUMN campanhas.estrategia IS 'Estratégia de veiculação: cpc, cpm, cpa, cpl';

COMMENT ON TABLE areas_favoritas IS 'Áreas favoritas salvas pelas empresas para reutilização';
COMMENT ON TABLE campanha_templates IS 'Templates de campanha para facilitar criação';
COMMENT ON TABLE nicho_categorias IS 'Categorias disponíveis por nicho';

-- ============================================
-- FIM DO SCRIPT
-- ============================================


