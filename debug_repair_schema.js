const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('repair_tasks').select('*').limit(1);
    if (error) {
        console.error("Error fetching repair_tasks:", error);
    } else {
        console.log("REpair Task Sample / Columns:", data[0] ? Object.keys(data[0]) : "No data, but table exists");
        if (data[0]) console.log("Sample row:", data[0]);
    }
}

checkColumns();
