import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sgpikecotolcxjivzfid.supabase.co', 'sb_publishable_b1RmmePB8q3w-aNiXr1Law_huegvLQD');

async function check() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.log('Error:', error.message);
        } else {
            console.log('Profiles data:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

check();
