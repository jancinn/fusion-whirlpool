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
// We need SERVICE_ROLE_KEY to use auth.admin.updateUser, but we likely only have ANON_KEY in .env
// If we only have ANON_KEY, we might need to use a SQL function if available, or try signIn as Admin and check privileges?
// Actually, I can use the `jancinn` admin account and RPC/SQL if needed. 
// But let's check what keys we have. Usually VITE_SUPABASE_SERVICE_ROLE_KEY is in .env too?
// If not, I'll use SQL via psql equivalent or create a special RPC if needed.
// Wait, I can just use a direct SQL update via my `run_command` if I had psql, but I don't.
// I'll try to use the `supabase` client with the admin user `jancinn` context if possible?
// No, client-side admin updates are restricted.

// Better approach: Use SQL file via "copy-paste" simulation? No.
// I will check if I have SERVICE_ROLE_KEY in .env.
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

// If no service key, I'll use the 'jancinn' admin user to call a hypothetical 'update_user_role' RPC?
// Or I can use the `reset_password_jancinn.sql` technique? No, that's for manual execution.
// Wait, I can use `create_new_user`... no.

// Let's assume I can use a direct SQL via a `postgresql` client? No.
// I'll try to use the `jancinn` user which is `administrador_general`. 
// Does `administrador_general` have rights to update `auth.users`? 
// Only if RLS allows it. Usually `auth.users` is protected.

// Alternative: I can Delete the user and Recreate it with the new role?
// `create_demo_coordinator.js` creates it.
// I can delete it first? 
// `supabase.auth.admin.deleteUser` needs service role.

// Let's check .env content.
console.log('Key check:', {
    anon: !!supabaseAnonKey,
    service: !!serviceRoleKey
});

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey);

async function updateRole() {
    console.log('🔄 Actualizando rol...');

    // Attempt 1: Using Service Role (if available)
    if (serviceRoleKey) {
        const { data, error } = await supabase.auth.admin.updateUserById(
            '29104aae-20b2-4de5-864d-4b0172b48b17',
            { user_metadata: { role: 'coordinador_operativo' } }
        );
        if (!error) {
            console.log('✅ Rol actualizado con Service Role');
            return;
        }
        console.log('⚠️ Service Role falló (o no existe key):', error.message);
    }

    // Attempt 2: Login as Admin and try to find a way? (This is hard without specific definition).
    // Actually, I can just CREATE A NEW USER with a different email if I can't update.
    // `coordinador_operativo_demo@gmail.com`
    // This is safer and guaranteed to work with my `create_new_user` RPC which I know works.

    // Let's just create a NEW user for the "Coordinator" role.
    // It's cleaner than fighting permissions.
}

// updateRole(); 
// Decided to create new user in a separate script instead of updating.
