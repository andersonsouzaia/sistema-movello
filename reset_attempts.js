import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function resetAttempts() {
    const email = 'llegionstudio@gmail.com'
    console.log('Resetting login attempts for:', email)

    // We can't easily reset rate limits (supaws) but we can check if our custom table "login_attempts" is blocking.
    // Although signInWithPassword error usually comes from Auth service, not our table (unless we block BEFORE).
    // The AuthContext 'signIn' checks checkLoginAttempts FIRST.

    // Let's reset our custom tracking if it exists
    const { data: users } = await supabase.from('users').select('id').eq('email', email).single()

    if (users) {
        console.log('User found:', users.id)
        const { error } = await supabase.rpc('resetar_tentativas_login', { p_user_id: users.id })
        if (error) console.error('Error resetting attempts:', error)
        else console.log('Custom login attempts reset.')
    } else {
        console.log('User not found by email')
    }
}

resetAttempts()
