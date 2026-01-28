-- ============================================
-- RESTRICT CAMPAIGN CATEGORIES
-- Migração 054: Definir categorias fixas e adicionar coluna de categoria única
-- ============================================

-- 1. Criar Type ENUM para Categorias
DO $$ BEGIN
    CREATE TYPE categoria_campanha AS ENUM (
        'News',
        'Food',
        'Saúde',
        'Jogos',
        'Kids',
        'Shopping',
        'Turismo',
        'Fitness',
        'Educação'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar coluna 'categoria' na tabela 'campanhas'
DO $$ BEGIN
    ALTER TABLE campanhas 
    ADD COLUMN categoria categoria_campanha;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Atualizar campanhas existentes (fallback para 'News' se não tiver nenhuma correta)
-- Como é um sistema novo/em dev, podemos definir um default ou deixar null se permitido.
-- Vamos deixar NULL por enquanto, mas garantir que novas tenham.

-- 4. Função auxiliar para validar categoria (opcional, já garantido pelo enum)
