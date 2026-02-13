
import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://dgsuenfqujouikjefymm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM";

const supabase = createClient(supabaseURL, supabaseKey);

async function testInsert() {
    console.log("Testing CHECKLIST insert with null status...");
    const { error: err1 } = await supabase.from('checklist').insert({
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: null
    });
    if (err1) console.error("CHECKLIST Error:", JSON.stringify(err1, null, 2));
    else console.log("CHECKLIST Success");

    console.log("\nTesting DELEGATION insert with null status...");
    const { error: err2 } = await supabase.from('delegation').insert({
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: null
    });
    if (err2) console.error("DELEGATION Error:", JSON.stringify(err2, null, 2));
    else console.log("DELEGATION Success");
}

testInsert();
