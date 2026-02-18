import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sgpikecotolcxjivzfid.supabase.co', 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD');

async function check() {
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.log('public.users does not exist or is not accessible:', error.message);
        } else {
            console.log('public.users exists');
        }
    } catch (e) {
        console.log('Error checking public.users:', e.message);
    }
}

check();
