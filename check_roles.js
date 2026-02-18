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

async function checkRoles() {
    console.log('🔍 Listando usuarios y roles...');

    const { data: users, error } = await supabase.rpc('get_users_list');

    if (error) {
        console.error('❌ Error al obtener lista:', error.message);
        return;
    }

    // Filter relevant roles
    const coordinators = users.filter(u =>
        u.role === 'director_ministerio' ||
        u.role === 'coordinador' ||
        u.role === 'coordinador_operativo'
    );

    console.log('--- TODOS LOS USUARIOS ---');
    users.forEach(u => console.log(`${u.email}: ${u.role}`));

    console.log('\n--- COORDINADORES ENCONTRADOS ---');
    if (coordinators.length > 0) {
        coordinators.forEach(u => console.log(`✅ ${u.email} (${u.role})`));
    } else {
        console.log('❌ No se encontraron coordinadores.');
    }
}

checkRoles();
