import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Para tracking, idealmente usar Service Role para garantir escrita, 
        // mas aqui usaremos o cliente do contexto autenticado (ou anon se permitido RLS)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { campanha_id, lat, lng, device_id, timestamp } = await req.json()

        if (!campanha_id) {
            throw new Error('ID da campanha é obrigatório')
        }

        // 1. Calcular Custo (Logica simples: debitar valor fixo ou baseado em CPM)
        // Para MVP, vamos apenas registrar a view. O debito financeiro pode ser via Trigger no Banco ou aqui.
        // Vamos assumir que existe uma tabela 'impressoes'

        const { error } = await supabaseClient
            .from('impressoes')
            .insert({
                campanha_id,
                device_id,
                lat,
                lng,
                created_at: timestamp || new Date().toISOString(),
                custo: 0.10 // Exemplo: R$ 0,10 por view
            })

        if (error) {
            // Se a tabela não existir, apenas logamos (fallback)
            console.error('Erro ao salvar impressao:', error)
            // Não falhar a request para o tablet não travar
        } else {
            // 2. Opcional: Atualizar orçamento_utilizado RPC
            await supabaseClient.rpc('increment_orcamento_utilizado', {
                p_campanha_id: campanha_id,
                p_valor: 0.10
            })
        }

        return new Response(
            JSON.stringify({ success: true }),
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
