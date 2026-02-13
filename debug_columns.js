
import https from 'https';

const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3VlbmZxdWpvdWlramVmeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIxNzQsImV4cCI6MjA4NTg1ODE3NH0.WE6CZBqSkZB5m5iE0iFsiru2FSJ70O1ZJBc_xNL9FYM';

function checkTable(tableName) {
    const options = {
        hostname: 'dgsuenfqujouikjefymm.supabase.co',
        path: `/rest/v1/${tableName}?select=*&limit=1`,
        headers: {
            'apikey': apikey,
            'Authorization': 'Bearer ' + apikey
        }
    };

    https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`${tableName.toUpperCase()} Columns:`, Object.keys(json[0] || {}));
            } catch (e) {
                console.error(`Error parsing ${tableName}:`, data);
            }
        });
    }).on('error', (err) => {
        console.error(`Error fetching ${tableName}:`, err.message);
    });
}

checkTable('checklist');
checkTable('delegation');
checkTable('maintenance_tasks');
checkTable('repair_tasks');
checkTable('ea_tasks');
