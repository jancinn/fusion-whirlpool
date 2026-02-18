import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgpikecotolcxjivzfid.supabase.co'
const supabaseAnonKey = 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log("--- VERIFICACIÓN DE ROL ---");
console.log("Usuario: jancinn@gmail.com");

const { data, error } = await supabase.auth.signInWithPassword({
    email: 'jancinn@gmail.com',
    password: '123456'
})

if (error) {
    console.log('❌ ERROR LOGIN:', error.message)
} else {
    console.log('✅ LOGIN EXITOSO')
    console.log('   ID:', data.user.id)
    console.log('   ROL (Metadata):', data.user.user_metadata.role)
    console.log('   ROL (JWT):', data.user.role) // Este es el rol de Supabase (authenticated), no el de la app
}
