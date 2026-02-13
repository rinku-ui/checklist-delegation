import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('repair_tasks').select('*').limit(1);
        if (error) {
            console.error("Error fetching repair_tasks:", error);
        } else {
            console.log("Repair Task Sample / Columns:", data[0] ? Object.keys(data[0]) : "No data, but table exists");
            if (data[0]) console.log("Sample row:", data[0]);

            // If data[0] is not available, try to get column names via an empty select
            if (!data[0]) {
                const { data: cols, error: err2 } = await supabase.from('repair_tasks').select().limit(0);
                console.log("Empty select results:", cols);
            }
        }
    } catch (e) {
        console.error("Unhandled error:", e);
    }
}

checkColumns();
