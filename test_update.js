import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sgpikecotolcxjivzfid.supabase.co', 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD');

async function testUpdate() {
    const { data: users } = await supabase.rpc('get_users_list');
    const target = users.find(u => u.email.includes('test.secretaria'));
    if (!target) {
        console.log('Target user not found');
        return;
    }

    console.log('Updating name for', target.email);
    const { data, error } = await supabase.rpc('update_user_profile', {
        new_first_name: 'TEST_FIX',
        new_last_name: 'ROBOT',
        new_role: 'staff',
        target_user_id: target.id
    });
    console.log('Result:', data, error);
}
testUpdate();
