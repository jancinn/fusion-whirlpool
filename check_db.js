const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.rpc('list_public_functions');
    console.log('Functions:', JSON.stringify(data, null, 2));

    const { data: tables, error: tableError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    console.log('Users table exists:', !tableError);
}

check();
