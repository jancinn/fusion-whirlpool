import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRosario() {
    console.log('🔍 Buscando a Rosario Garcia...');

    const { data, error } = await supabase.rpc('get_users_list');

    if (error) {
        console.error('❌ Error al obtener lista:', error.message);
        return;
    }

    const rosario = data.find(u => u.email === 'rogaro571@gmail.com');
    if (rosario) {
        console.log('✅ Rosario Garcia ENCONTRADA:', rosario);
    } else {
        console.log('❌ Rosario Garcia NO encontrada en la lista.');
    }
}

checkRosario();
