import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectFunctions() {
    console.log('🔍 Inspeccionando funciones en el esquema public...');

    const { data, error } = await supabase.rpc('inspect_functions', {});

    if (error) {
        // Si inspect_functions no existe, intentamos una consulta directa vía SQL si fuera posible, 
        // pero como no podemos, usaremos un truco: intentar llamar a la función con un argumento erróneo 
        // para ver si el error cambia.
        console.log('❌ Error al inspeccionar (la función inspect_functions probablemente no existe)');

        console.log('🧪 Probando llamada minimalista a create_new_user...');
        const { error: rpcError } = await supabase.rpc('create_new_user', {
            new_email: 'test@test.com',
            new_first_name: 'a',
            new_last_name: 'b',
            new_password: 'c',
            new_role: 'd'
        });
        console.log('Resultado:', rpcError?.message);
    } else {
        console.log('Funciones encontradas:', data);
    }
}

inspectFunctions();
