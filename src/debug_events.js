import { supabase } from './lib/supabase';

async function checkEvents() {
    console.log('Checking events...');
    const { data, error } = await supabase
        .from('solicitudes')
        .select('*');

    if (error) {
        console.error('Error fetching events:', error);
    } else {
        console.log('Found', data.length, 'events.');
        data.forEach(event => {
            console.log(`- ID: ${event.id}, Date: ${event.event_date}, Type: ${event.activity_type}, Status: ${event.status}`);
        });
    }
}

checkEvents();
