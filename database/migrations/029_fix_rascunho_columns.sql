-- ============================================
-- CORREÇÃO: Colunas faltantes para rascunhos
-- Migração 029: Garantir que todas as colunas necessárias existam
-- Data: 2024
-- ============================================

-- Verificar e adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar colunas de geolocalização se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'localizacao_tipo'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN localizacao_tipo VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'raio_km'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN raio_km DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'centro_latitude'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN centro_latitude DECIMAL(10,8);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'centro_longitude'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN centro_longitude DECIMAL(11,8);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'poligono_coordenadas'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN poligono_coordenadas JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'cidades'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN cidades TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'estados'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN estados TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'regioes'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN regioes TEXT[];
    END IF;

    -- Adicionar colunas de nicho e segmentação
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'nicho'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN nicho VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'categorias'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN categorias TEXT[];
    END IF;

    -- Adicionar colunas de público-alvo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'publico_alvo'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN publico_alvo JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'horarios_exibicao'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN horarios_exibicao JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'dias_semana'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN dias_semana INTEGER[];
    END IF;

    -- Adicionar colunas de objetivos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'objetivo_principal'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN objetivo_principal VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'objetivos_secundarios'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN objetivos_secundarios TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'kpis_meta'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN kpis_meta JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'estrategia'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN estrategia VARCHAR(10);
    END IF;

    -- Garantir que orcamento_utilizado existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'orcamento_utilizado'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN orcamento_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

COMMENT ON COLUMN campanhas.localizacao_tipo IS 'Tipo de localização: raio, poligono, cidade, estado, regiao';
COMMENT ON COLUMN campanhas.raio_km IS 'Raio em km para localização tipo raio';
COMMENT ON COLUMN campanhas.centro_latitude IS 'Latitude do centro para localização tipo raio';
COMMENT ON COLUMN campanhas.centro_longitude IS 'Longitude do centro para localização tipo raio';
COMMENT ON COLUMN campanhas.poligono_coordenadas IS 'Coordenadas do polígono para localização tipo poligono';
COMMENT ON COLUMN campanhas.cidades IS 'Lista de cidades para localização tipo cidade';
COMMENT ON COLUMN campanhas.estados IS 'Lista de estados para localização tipo estado';
COMMENT ON COLUMN campanhas.regioes IS 'Lista de regiões para localização tipo regiao';
COMMENT ON COLUMN campanhas.nicho IS 'Nicho da campanha';
COMMENT ON COLUMN campanhas.categorias IS 'Categorias da campanha';
COMMENT ON COLUMN campanhas.publico_alvo IS 'Dados do público-alvo em JSON';
COMMENT ON COLUMN campanhas.horarios_exibicao IS 'Horários de exibição em JSON';
COMMENT ON COLUMN campanhas.dias_semana IS 'Dias da semana (0-6, onde 0 é domingo)';
COMMENT ON COLUMN campanhas.objetivo_principal IS 'Objetivo principal da campanha';
COMMENT ON COLUMN campanhas.objetivos_secundarios IS 'Objetivos secundários da campanha';
COMMENT ON COLUMN campanhas.kpis_meta IS 'KPIs e metas em JSON';
COMMENT ON COLUMN campanhas.estrategia IS 'Estratégia de cobrança: cpc, cpm, cpa, cpl';


