import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sgpikecotolcxjivzfid.supabase.co', 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD');

async function createTestUser() {
    console.log('Creating test user...');
    const { data, error } = await supabase.rpc('create_new_user', {
        new_email: 'test.role.final@test.com',
        new_first_name: 'Test',
        new_last_name: 'Role',
        new_password: 'password123',
        new_role: 'secretaria'
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created:', data);

        // Now check if the role is there
        const { data: users } = await supabase.rpc('get_users_list');
        const target = users.find(u => u.email === 'test.role.final@test.com');
        console.log('Verified user data:', target);
    }
}

createTestUser();
