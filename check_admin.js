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

async function checkAdmin() {
    console.log('🔍 Buscando a jancinn@gmail.com...');

    const { data, error } = await supabase.rpc('get_users_list');

    if (error) {
        console.error('❌ Error al obtener lista:', error.message);
        return;
    }

    // Log all emails to see what's there
    console.log('Usuarios encontrados:', data.map(u => u.email));

    const admin = data.find(u => u.email === 'jancinn@gmail.com');
    if (admin) {
        console.log('✅ Admin ENCONTRADO:', admin);
        console.log('Rol:', admin.role || admin.raw_user_meta_data?.role);
    } else {
        console.log('❌ Admin NO encontrado en la lista.');
    }
}

checkAdmin();
