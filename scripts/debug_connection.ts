
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manual .env loading
try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8')
        envConfig.split('\n').forEach(line => {
            const [key, ...values] = line.split('=')
            if (key && values.length > 0) {
                process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '')
            }
        })
    }
} catch (e) {
    console.warn('Failed to load .env', e)
}

// Hardcoded for testing since we might not have .env loaded in this context if it's strictly local
// Taking values from user logs: https://yzxixqyxkjosveohvdbd.supabase.co
// We need the ANON KEY. I'll search for it in the codebase first or assume it's in .env
// If I can't find it, I'll ask the user? No, I can verify .env exists.

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yzxixqyxkjosveohvdbd.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
    console.error('VITE_SUPABASE_ANON_KEY missing')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('--- Testing Connection ---')
    console.log('URL:', supabaseUrl)

    // 1. Test Simple Healthcheck (Select count from public table?)
    // Users table might be protected. Login attempts might be open.
    try {
        const start = Date.now()
        const { data, error } = await supabase.from('login_attempts').select('count', { count: 'exact', head: true })
        console.log(`1. Public Table Check (login_attempts): ${Date.now() - start}ms`, { error: error?.message, status: error ? 'FAIL' : 'OK' })
    } catch (e) {
        console.log('1. Public Table Check Exception:', e)
    }

    // 2. Test RPC get_user_profile with a fake UUID
    try {
        const fakeId = 'f9c2dd84-7328-4990-acf9-55f9ac9827a4'
        console.log('2. Testing RPC get_user_profile (REAL ID)...')
        const start = Date.now()

        // ADD TIMEOUT
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
        const rpc = supabase.rpc('get_user_profile', { p_user_id: fakeId })

        const { data, error } = await Promise.race([rpc, timeout]) as any

        console.log(`2. RPC Result: ${Date.now() - start}ms`, { error: error?.message, data })
    } catch (e: any) {
        console.log(`2. RPC Exception: ${e.message}`)
    }

    // 3. Test Direct Select on Users (RLS might block, but shouldn't hang)
    try {
        const fakeId = '00000000-0000-0000-0000-000000000000'
        console.log('3. Testing Direct Select (Fake ID)...')
        const start = Date.now()
        const { data, error } = await supabase.from('users').select('*').eq('id', fakeId).single()
        console.log(`3. Direct Select Result: ${Date.now() - start}ms`, { error: error?.message, code: error?.code })
    } catch (e) {
        console.log('3. Direct Select Exception:', e)
    }

    // 3.5 Check specific user in public.users
    try {
        const targetId = 'f9c2dd84-7328-4990-acf9-55f9ac9827a4'
        console.log(`3.5 Checking public.users for ${targetId}...`)
        const start = Date.now()
        const { data, error } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle()
        console.log(`3.5 User Check Result: ${Date.now() - start}ms`, {
            found: !!data,
            email: data?.email,
            error: error?.message
        })
    } catch (e: any) {
        console.log('3.5 User Check Exception:', e.message)
    }

    // 4. Check nicho_categorias table
    try {
        console.log('4. Checking nicho_categorias table...')
        const start = Date.now()
        const { data, error } = await supabase.from('nicho_categorias').select('*').limit(5)
        console.log(`4. Nicho Categorias Data: ${Date.now() - start}ms`, { rows: data?.length, error: error?.message, sample: data ? data[0] : null })

        if (data && data.length === 0) {
            console.log('   ⚠️ Table exists but is EMPTY. Seed data missing?')
        }
    } catch (e: any) {
        console.log('4. Nicho Categorias Check Exception:', e.message)
    }
}

testConnection()
