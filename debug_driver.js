import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
    const email = 'llegionstudio@gmail.com'
    const password = '230180Pai#'

    console.log('Authenticating...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (authError) {
        console.error('Auth check failed:', authError)
        return
    }

    const userId = authData.user.id
    console.log('Auth success. UserId:', userId)

    console.log('Fetching profile via RPC...')
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile', {
        p_user_id: userId
    })

    if (rpcError) {
        console.error('RPC failed:', rpcError)
    } else {
        console.log('RPC success:', rpcData)
    }

    console.log('Fetching profile via Direct Select...')
    const { data: directData, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (directError) {
        console.error('Direct Select failed:', directError)
    } else {
        console.log('Direct Select success:', directData)
    }

    if (directData?.tipo === 'motorista') {
        console.log('Fetching Motorista details...')
        const { data: motoristaData, error: motoristaError } = await supabase
            .from('motoristas')
            .select('*')
            .eq('id', userId)
            .single()
        if (motoristaError) console.error('Motorista fetch failed:', motoristaError)
        else console.log('Motorista data:', motoristaData)
    }
}

test()
