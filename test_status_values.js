
import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://dgsuenfqujouikjefymm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM";

const supabase = createClient(supabaseURL, supabaseKey);

async function test() {
    console.log("Testing DELEGATION with status: pending...");
    const { error: err1 } = await supabase.from('delegation').insert({
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: 'pending'
    });
    if (err1) console.error("DELEGATION Error:", JSON.stringify(err1, null, 2));
    else console.log("DELEGATION Success");

    console.log("\nTesting CHECKLIST with status: yes...");
    const { error: err2 } = await supabase.from('checklist').insert({
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: 'yes'
    });
    if (err2) console.error("CHECKLIST 'yes' Error:", JSON.stringify(err2, null, 2));
    else console.log("CHECKLIST 'yes' Success");

    console.log("\nTesting CHECKLIST with status: pending...");
    const { error: err3 } = await supabase.from('checklist').insert({
        department: 'Test',
        given_by: 'Test',
        name: 'Test',
        task_description: 'Test',
        task_start_date: new Date().toISOString(),
        frequency: 'one-time',
        status: 'pending'
    });
    if (err3) console.error("CHECKLIST 'pending' Error:", JSON.stringify(err3, null, 2));
    else console.log("CHECKLIST 'pending' Success");
}

test();
