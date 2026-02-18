import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserCreation() {
    console.log('🚀 Iniciando prueba de creación de usuario...');

    // 1. Login as admin (jancinn@gmail.com)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'jancinn@gmail.com',
        password: 'inn123'
    });

    if (authError) {
        console.error('❌ Error de autenticación:', authError.message);
        return;
    }

    console.log('✅ Autenticado como admin');

    // 2. Create a new user via RPC
    const testEmail = `test_user_${Date.now()}@example.com`;
    console.log(`📝 Intentando crear usuario: ${testEmail}`);

    const { data: createData, error: createError } = await supabase.rpc('create_new_user', {
        new_email: testEmail,
        new_password: 'password123',
        new_first_name: 'Test',
        new_last_name: 'RPC',
        new_role: 'staff'
    });

    if (createError) {
        console.error('❌ Error al crear usuario (RPC):', createError.message);
    } else {
        console.log('✅ Resultado de creación:', createData);
    }

    // 3. Update the user via RPC
    if (createData && createData.success) {
        const userId = createData.user_id;
        console.log(`📝 Intentando actualizar usuario: ${userId}`);

        const { data: updateData, error: updateError } = await supabase.rpc('update_user_profile', {
            target_user_id: userId,
            new_first_name: 'Test Updated',
            new_last_name: 'RPC Updated',
            new_role: 'coordinador_operativo'
        });

        if (updateError) {
            console.error('❌ Error al actualizar usuario (RPC):', updateError.message);
        } else {
            console.log('✅ Resultado de actualización:', updateData);
        }
    }

    // 4. List users
    console.log('📝 Listando usuarios...');
    const { data: listData, error: listError } = await supabase.rpc('get_users_list');

    if (listError) {
        console.error('❌ Error al listar usuarios:', listError.message);
    } else {
        console.log(`✅ Se encontraron ${listData.length} usuarios`);
        const createdUser = listData.find(u => u.email === testEmail);
        if (createdUser) {
            console.log('✅ Usuario creado encontrado en la lista:', createdUser);
        } else {
            console.log('❌ Usuario creado NO encontrado en la lista');
        }
    }

    await supabase.auth.signOut();
}

testUserCreation();
