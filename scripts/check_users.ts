
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
    console.log('Checking users...')

    // Fetch empresas
    const { data: empresas, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .limit(5)

    if (empresaError) {
        console.error('Error fetching empresas:', empresaError)
    } else {
        console.log('Empresas:', empresas.map(e => ({ id: e.id, email: e.email, status: e.status, razao_social: e.razao_social })))
    }

    // Fetch profiles to see linked users if needed, though empresas usually links to auth.users via owner_id or similar often, but here it seems 'empresas' table has the data.
    // Let's check if there's an 'owner_id' or if the email is in the empresa table.
    // Previous code showed `empresa` object in context.
}

checkUsers()
