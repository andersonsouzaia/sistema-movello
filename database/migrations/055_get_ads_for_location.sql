-- ============================================
-- GET ADS FOR LOCATION RPC
-- Migração 055: Função RPC para buscar campanhas por localização
-- ============================================

-- Habilitar PostGIS se não estiver habilitado
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION get_ads_for_location(
    p_lat double precision,
    p_lng double precision,
    p_categorias text[] DEFAULT NULL -- Opcional: filtrar por categorias específicas
)
RETURNS TABLE (
    id uuid,
    titulo text,
    descricao text,
    categoria text,
    midias_urls text[],
    qr_code_link text,
    distancia_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permite rodar sem precisar de permissões diretas nas tabelas (controlado pela policy da function)
AS $$
DECLARE
    v_user_location geometry;
BEGIN
    -- Criar ponto geométrico a partir da lat/lng (SRID 4326)
    v_user_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

    RETURN QUERY
    SELECT 
        c.id,
        c.titulo,
        c.descricao,
        c.categoria::text,
        c.midias_urls,
        c.qr_code_link,
        -- Calcular distância aproximada em KM (para debugging ou ordenação)
        (ST_Distance(
            v_user_location::geography, 
            ST_SetSRID(ST_MakePoint(c.centro_longitude, c.centro_latitude), 4326)::geography
        ) / 1000)::double precision as distancia_km
    FROM 
        campanhas c
    WHERE 
        c.status = 'ativa'
        AND c.orcamento_utilizado < c.orcamento
        AND NOW() BETWEEN c.data_inicio::timestamp AND c.data_fim::timestamp
        AND (
            -- Filtro por Categoria (se fornecido)
            p_categorias IS NULL OR c.categoria::text = ANY(p_categorias)
        )
        AND (
            -- Lógica de Localização: Raio
            (
                c.localizacao_tipo = 'raio' 
                AND ST_DWithin(
                    v_user_location::geography,
                    ST_SetSRID(ST_MakePoint(c.centro_longitude, c.centro_latitude), 4326)::geography,
                    c.raio_km * 1000 -- Convertendo KM para Metros
                )
            )
            OR
            -- Lógica de Localização: Polígono
            (
                c.localizacao_tipo = 'poligono'
                -- Assumindo que temos uma coluna geometry 'area_poligono' ou construindo on-the-fly
                -- Como o schema atual usa array de coordenadas, precisamos reconstruir o polígono se não houver coluna geometry.
                -- Por performance, o ideal seria ter uma coluna geometry indexada. 
                -- Vamos tentar construir on-the-fly para o MVP, mas note que isso é lento para muitos dados.
                -- TODO: Criar coluna geometry persistida.
                AND (
                    SELECT ST_Contains(
                        ST_SetSRID(ST_MakePolygon(ST_MakeLine(
                            ARRAY(
                                SELECT ST_MakePoint(coords[1], coords[2])
                                FROM jsonb_array_elements(to_jsonb(c.poligono_coordenadas)) WITH ORDINALITY t(coords, ord)
                            )
                        )), 4326),
                        v_user_location
                    )
                )
            )
            -- (Adicione outras lógicas: Cidade/Estado se necessário)
        );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_ads_for_location TO anon;
GRANT EXECUTE ON FUNCTION get_ads_for_location TO service_role;
