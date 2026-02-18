import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listFunctions() {
    console.log('🔍 Intentando listar funciones...');

    const { data, error } = await supabase.rpc('list_public_functions');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Funciones encontradas:');
        console.table(data);
    }
}

listFunctions();
