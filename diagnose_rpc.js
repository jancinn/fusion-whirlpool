import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRPC() {
    console.log('🔍 Diagnosticando funciones RPC...');

    const functionsToTest = ['get_users_list', 'create_new_user', 'update_user_profile', 'get_admin_count'];

    for (const fn of functionsToTest) {
        try {
            // Intentar llamar a la función con parámetros nulos solo para ver si existe
            const { error } = await supabase.rpc(fn, {});
            if (error && error.message.includes('Could not find the function')) {
                console.log(`❌ ${fn}: NO ENCONTRADA`);
            } else {
                console.log(`✅ ${fn}: ENCONTRADA (o error de parámetros, pero existe)`);
                if (error) console.log(`   (Detalle: ${error.message})`);
            }
        } catch (e) {
            console.log(`❌ ${fn}: Error inesperado - ${e.message}`);
        }
    }
}

diagnoseRPC();
