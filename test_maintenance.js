
import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://dgsuenfqujouikjefymm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM";

const supabase = createClient(supabaseURL, supabaseKey);

async function testInsert() {
    console.log("Testing MAINTENANCE_TASKS insert...");
    const { error: err } = await supabase.from('maintenance_tasks').insert({
        department: 'Maintenance',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        freq: 'daily',
        status: 'Pending'
    });
    if (err) console.error("MAINTENANCE_TASKS Error:", JSON.stringify(err, null, 2));
    else console.log("MAINTENANCE_TASKS Success");
}

testInsert();
