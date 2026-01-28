import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { lat, lng, device_id, categories } = await req.json()

        if (!lat || !lng) {
            throw new Error('Latitude e Longitude são obrigatórios')
        }

        // 1. Chamar RPC do Banco para filtro espacial e categorias
        const { data: ads, error } = await supabaseClient.rpc('get_ads_for_location_v3', {
            p_lat: lat,
            p_lng: lng,
            p_categorias: categories || null
        })

        if (error) throw error

        // 2. Lógica Adicional de Filtragem (Edge Side)
        // Exemplo: Filtrar duplicatas, blacklists de device, etc.
        // Por enquanto, apenas mapeia para o formato final

        const playlist = ads.map((ad: any) => ({
            id: ad.id,
            titulo: ad.titulo,
            categoria: ad.categoria,
            // Garantir que a URL da mídia está completa
            media_url: ad.midias_urls && ad.midias_urls.length > 0 ? ad.midias_urls[0] : null,
            qr_code_link: ad.qr_code_link,
            tipo: 'video', // TODO: Inferir do arquivo ou banco
            duration: 15, // TODO: Pegar do banco se existir
            impression_token: `imp_${ad.id}_${Date.now()}` // Token para track-impression
        })).filter((item: any) => item.media_url !== null)

        // 3. (Opcional) Logar a requisição do tablet para analytics de "Heartbeat"
        console.log(`Tablet ${device_id} requested ads at ${lat}, ${lng}. Returned ${playlist.length} ads.`)

        return new Response(
            JSON.stringify({
                playlist,
                next_fetch_in_seconds: 300 // 5 minutos
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
