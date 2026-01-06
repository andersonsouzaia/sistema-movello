-- ============================================
-- TEMPLATES PADRÃO DO SISTEMA
-- Migração 027: Inserir templates pré-definidos do sistema
-- Data: 2024
-- ============================================

-- Template 1: Campanha de Awareness para Restaurantes
INSERT INTO campaign_templates (
    nome,
    descricao,
    nicho,
    objetivo_principal,
    categoria,
    is_sistema,
    dados_template,
    compartilhado
) VALUES (
    'Awareness - Restaurante Local',
    'Template otimizado para restaurantes que querem aumentar o conhecimento da marca na região',
    'restaurante',
    'awareness',
    'restaurante',
    true,
    '{
        "titulo": "Campanha de Awareness - Restaurante",
        "descricao": "Aumente o conhecimento da sua marca na região",
        "orcamento": 1000,
        "localizacao_tipo": "raio",
        "raio_km": 5,
        "nicho": "restaurante",
        "objetivo_principal": "awareness",
        "publico_alvo": {
            "idade_min": 25,
            "idade_max": 65,
            "genero": ["Todos"]
        },
        "dias_semana": [1, 2, 3, 4, 5, 6],
        "horarios_exibicao": {
            "almoco": {"inicio": "11:00", "fim": "14:00"},
            "jantar": {"inicio": "18:00", "fim": "22:00"}
        },
        "estrategia": "cpm"
    }'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Template 2: Campanha de Conversão para E-commerce
INSERT INTO campaign_templates (
    nome,
    descricao,
    nicho,
    objetivo_principal,
    categoria,
    is_sistema,
    dados_template,
    compartilhado
) VALUES (
    'Conversão - E-commerce',
    'Template focado em gerar vendas e conversões para lojas online',
    'varejo',
    'conversions',
    'varejo',
    true,
    '{
        "titulo": "Campanha de Conversão - E-commerce",
        "descricao": "Gere vendas e conversões para sua loja online",
        "orcamento": 2000,
        "localizacao_tipo": "estado",
        "nicho": "varejo",
        "objetivo_principal": "conversions",
        "publico_alvo": {
            "idade_min": 18,
            "idade_max": 55,
            "genero": ["Todos"]
        },
        "dias_semana": [1, 2, 3, 4, 5, 6, 0],
        "horarios_exibicao": {
            "manha": {"inicio": "08:00", "fim": "12:00"},
            "tarde": {"inicio": "14:00", "fim": "18:00"},
            "noite": {"inicio": "19:00", "fim": "23:00"}
        },
        "kpis_meta": {
            "conversoes": 100,
            "cpc": 2.5,
            "roi": 150
        },
        "estrategia": "cpa"
    }'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Template 3: Campanha de Tráfego para Serviços
INSERT INTO campaign_templates (
    nome,
    descricao,
    nicho,
    objetivo_principal,
    categoria,
    is_sistema,
    dados_template,
    compartilhado
) VALUES (
    'Tráfego - Serviços Profissionais',
    'Template para profissionais que querem gerar leads e tráfego para seu site',
    'servicos',
    'traffic',
    'servicos',
    true,
    '{
        "titulo": "Campanha de Tráfego - Serviços",
        "descricao": "Gere leads qualificados para seu negócio",
        "orcamento": 1500,
        "localizacao_tipo": "cidade",
        "nicho": "servicos",
        "objetivo_principal": "traffic",
        "publico_alvo": {
            "idade_min": 30,
            "idade_max": 60,
            "genero": ["Todos"]
        },
        "dias_semana": [1, 2, 3, 4, 5],
        "horarios_exibicao": {
            "comercial": {"inicio": "09:00", "fim": "18:00"}
        },
        "kpis_meta": {
            "cliques": 500,
            "ctr": 3.5,
            "cpc": 3.0
        },
        "estrategia": "cpc"
    }'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Template 4: Campanha de Engajamento para Redes Sociais
INSERT INTO campaign_templates (
    nome,
    descricao,
    nicho,
    objetivo_principal,
    categoria,
    is_sistema,
    dados_template,
    compartilhado
) VALUES (
    'Engajamento - Mídias Sociais',
    'Template para aumentar engajamento e interação nas redes sociais',
    'servicos',
    'engagement',
    'servicos',
    true,
    '{
        "titulo": "Campanha de Engajamento",
        "descricao": "Aumente o engajamento e interação com sua marca",
        "orcamento": 800,
        "localizacao_tipo": "raio",
        "raio_km": 10,
        "nicho": "servicos",
        "objetivo_principal": "engagement",
        "publico_alvo": {
            "idade_min": 18,
            "idade_max": 45,
            "genero": ["Todos"]
        },
        "dias_semana": [1, 2, 3, 4, 5, 6, 0],
        "horarios_exibicao": {
            "manha": {"inicio": "07:00", "fim": "12:00"},
            "tarde": {"inicio": "12:00", "fim": "18:00"},
            "noite": {"inicio": "18:00", "fim": "23:00"}
        },
        "estrategia": "cpm"
    }'::jsonb,
    true
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE campaign_templates IS 'Templates de campanha completos para reutilização - Templates padrão inseridos';

