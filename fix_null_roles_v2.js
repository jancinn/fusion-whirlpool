import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sgpikecotolcxjivzfid.supabase.co', 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD');

async function fixRoles() {
    console.log('Fetching users...');
    const { data: users, error: fetchError } = await supabase.rpc('get_users_list');
    if (fetchError) {
        console.error('Error fetching users:', fetchError);
        return;
    }

    for (const u of users) {
        if (!u.role) {
            console.log(`Attempting to fix role for ${u.email} (ID: ${u.id})...`);
            const { data, error: updateError } = await supabase.rpc('update_user_profile', {
                new_first_name: u.first_name || '',
                new_last_name: u.last_name || '',
                new_role: 'staff',
                target_user_id: u.id
            });

            if (updateError) {
                console.error(`RPC Error updating ${u.email}:`, updateError);
            } else if (data && data.success === false) {
                console.error(`Function Error updating ${u.email}:`, data.message);
            } else {
                console.log(`Successfully updated ${u.email} to staff. Result:`, data);
            }
        }
    }
    console.log('Done.');
}

fixRoles();
