import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgpikecotolcxjivzfid.supabase.co'
const supabaseAnonKey = 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log("--- PRUEBA DE CONEXIÓN ANÓNIMA ---");

// Intentar leer una tabla pública (si existe) o simplemente hacer un health check
// Como no sé qué tablas tienen datos, intentaré leer 'profiles' o 'messages' si existen
// O mejor, llamar a una función RPC simple si existe, o solo chequear auth.

async function testConnection() {
    try {
        // Intento 1: Leer profiles (debería fallar por RLS si no estamos logueados, pero no dar 500)
        console.log("Intentando leer public.profiles...");
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.log('❌ Error leyendo profiles:', error.message, error.code, error.details);
        } else {
            console.log('✅ Conexión a profiles exitosa (Status 200). Count:', data);
        }

    } catch (err) {
        console.log('❌ Excepción:', err);
    }
}

testConnection();
