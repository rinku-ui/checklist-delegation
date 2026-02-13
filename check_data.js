
import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://dgsuenfqujouikjefymm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM";

const supabase = createClient(supabaseURL, supabaseKey);

async function checkData() {
    console.log("REPAIR_TASKS data:");
    const { data, error } = await supabase.from('repair_tasks').select('*').limit(5);
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));

    console.log("\nCHECKLIST data:");
    const { data: data2, error: error2 } = await supabase.from('checklist').select('*').limit(1);
    if (error2) console.error(error2);
    else console.log(JSON.stringify(data2, null, 2));
}

checkData();
