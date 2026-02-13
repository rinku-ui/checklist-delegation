
import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://dgsuenfqujouikjefymm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM";

const supabase = createClient(supabaseURL, supabaseKey);

async function testVerbose() {
    console.log("Attempting to insert into CHECKLIST with 'status: pending'...");
    const { data, error } = await supabase.from('checklist').insert([{
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: 'pending' // This might be the issue
    }]).select();

    if (error) {
        console.error("CHECKLIST Final Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("CHECKLIST Success:", data);
    }

    console.log("\nChecking DELEGATION columns...");
    const { data: colData, error: colError } = await supabase.from('delegation').select('*').limit(1);
    if (colData) console.log("DELEGATION Keys:", Object.keys(colData[0] || {}));
}

testVerbose();
