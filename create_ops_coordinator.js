import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createOpsCoordinator() {
    console.log('👷 Creando Coordinador Operativo Demo...');

    const userData = {
        new_email: 'coordinador_operativo_demo@gmail.com',
        new_first_name: 'Coordinador',
        new_last_name: 'General', // Using "General" as requested by user ("Coordinador General")
        new_password: 'inn123',
        new_role: 'coordinador_operativo'
    };

    // First check if it exists
    const { data: users, error: listError } = await supabase.rpc('get_users_list');
    if (!listError) {
        const existing = users.find(u => u.email === userData.new_email);
        if (existing) {
            console.log('⚠️ El usuario ya existe:', existing);
            return;
        }
    }

    const { data, error } = await supabase.rpc('create_new_user', userData);

    if (error) {
        console.error('❌ Error al crear usuario:', error.message);
        return;
    }

    if (data && data.success) {
        console.log('✅ Usuario creado exitosamente:', data);
    } else {
        console.error('❌ Falló la creación:', data);
    }
}

createOpsCoordinator();
