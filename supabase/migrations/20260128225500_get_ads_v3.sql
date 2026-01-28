CREATE OR REPLACE FUNCTION get_ads_for_location_v3(
    p_lat double precision,
    p_lng double precision,
    p_categorias text[] DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    titulo text,
    descricao text,
    categoria text,
    midias_urls jsonb,
    qr_code_link text,
    distancia_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_location geometry;
BEGIN
    -- Criar ponto geométrico a partir da lat/lng (SRID 4326)
    v_user_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

    RETURN QUERY
    SELECT 
        c.id::uuid,
        c.titulo::text,
        c.descricao::text,
        c.categoria::text,
        COALESCE(c.midias_urls, '[]'::jsonb)::jsonb, -- Force JSONB and handle nulls
        c.qr_code_link::text,
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
            p_categorias IS NULL OR c.categoria::text = ANY(p_categorias)
        )
        AND (
            -- Lógica de Localização: Raio
            (
                c.localizacao_tipo = 'raio' 
                AND ST_DWithin(
                    v_user_location::geography,
                    ST_SetSRID(ST_MakePoint(c.centro_longitude, c.centro_latitude), 4326)::geography,
                    c.raio_km * 1000
                )
            )
            OR
            -- Lógica de Localização: Polígono
            (
                c.localizacao_tipo = 'poligono'
                AND (
                    SELECT ST_Contains(
                        ST_SetSRID(ST_MakePolygon(ST_MakeLine(
                            ARRAY(
                                SELECT ST_MakePoint(
                                    (coords->>0)::double precision, 
                                    (coords->>1)::double precision
                                )
                                FROM jsonb_array_elements(to_jsonb(c.poligono_coordenadas)) WITH ORDINALITY t(coords, ord)
                            )
                        )), 4326),
                        v_user_location
                    )
                )
            )
        );
END;
$$;

GRANT EXECUTE ON FUNCTION get_ads_for_location_v3 TO anon;
GRANT EXECUTE ON FUNCTION get_ads_for_location_v3 TO service_role;
