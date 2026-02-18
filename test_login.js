import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseKey); // Don't log full key

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Attempting login for jancinn@gmail.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jancinn@gmail.com',
        password: 'wrongpassword' // Just to see if we reach the server. If we get "Invalid login credentials", connection is good.
    });

    if (error) {
        console.error('Login Error:', error);
        console.error('Error Message:', error.message);
    } else {
        console.log('Login Success (Unexpected with wrong password):', data);
    }
}

testLogin();
