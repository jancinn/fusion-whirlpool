import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createRosario() {
    console.log('🚀 Iniciando creación de Rosario Garcia...');

    // 1. Login as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'jancinn@gmail.com',
        password: 'inn123'
    });

    if (authError) {
        console.error('❌ Error de autenticación:', authError.message);
        return;
    }

    console.log('✅ Autenticado como admin');

    // 2. Create Rosario via RPC (Alphabetical order)
    const { data: createData, error: createError } = await supabase.rpc('create_new_user', {
        new_email: 'rogaro571@gmail.com',
        new_first_name: 'Rosario',
        new_last_name: 'Garcia',
        new_password: '123456',
        new_role: 'staff'
    });

    if (createError) {
        console.error('❌ Error al crear usuario (RPC):', createError.message);
    } else {
        console.log('✅ Resultado de creación:', createData);
    }

    await supabase.auth.signOut();
}

createRosario();
