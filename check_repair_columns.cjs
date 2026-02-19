const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRepairColumns() {
    console.log(`\n--- repair_tasks ---`);
    const { data, error } = await supabase.from('repair_tasks').select('*').limit(1);
    if (error) {
        console.error(`Error fetching from repair_tasks:`, error.message);
    } else if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        // If no data, we can try to get them from an rpc or another way, 
        // but often selecting * on an empty table works in PostgREST to get headers if we had a more advanced client.
        // Actually, let's try to insert a dummy and delete it if empty? No, that's risky.
        // Let's just check if we can get anything.
        console.log('No data found to check columns');
    }
}

checkRepairColumns();
