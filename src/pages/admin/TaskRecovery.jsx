import React, { useState, useEffect } from "react";
import supabase from "../../SupabaseClient";
import AdminLayout from "../../components/layout/AdminLayout";

export default function TaskRecovery() {
    const [seriesList, setSeriesList] = useState([]);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorDate, setAnchorDate] = useState("");
    const [status, setStatus] = useState("");
    const [holidays, setHolidays] = useState([]);

    const [workingDays, setWorkingDays] = useState(new Set());
    const [activeTab, setActiveTab] = useState('checklist');
    const [duplicateStats, setDuplicateStats] = useState({}); // { seriesKey: count }

    useEffect(() => {
        fetchUniqueSeries();
        fetchHolidays();
        fetchWorkingDays();
    }, []);

    const fetchHolidays = async () => {
        const { data } = await supabase.from('holidays').select('holiday_date');
        if (data) setHolidays(data.map(h => h.holiday_date));
    };

    const fetchWorkingDays = async () => {
        const { data } = await supabase.from('working_day_calender').select('working_date');
        if (data) {
            setWorkingDays(new Set(data.map(d => d.working_date)));
        }
    };

    const fetchUniqueSeries = async (query = "") => {
        setIsLoading(true);
        const tableName = activeTab === 'maintenance' ? 'maintenance_tasks' : activeTab;
        const descField = activeTab === 'maintenance' ? 'task_description' : 'task_description'; // unified field

        setStatus(query ? `Searching across 15,000+ tasks for "${query}" in ${activeTab}...` : `Loading unique series from ${activeTab}...`);
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            while (hasMore && from < 20000) {
                let supabaseQuery = supabase
                    .from(tableName)
                    .select(`task_description, name, ${activeTab === 'maintenance' ? 'machine_name' : 'department'}, ${activeTab === 'maintenance' ? 'freq' : 'frequency'}`)
                    .is('submission_date', null)
                    .range(from, from + step - 1);

                if (query) {
                    supabaseQuery = supabaseQuery.or(`task_description.ilike.%${query}%,name.ilike.%${query}%`);
                }

                const { data, error } = await supabaseQuery;

                if (error) throw error;
                allData = [...allData, ...data];

                if (data.length < step) hasMore = false;
                from += step;
                if (!query) setStatus(`Fetched ${allData.length} records...`);
            }

            const seen = new Set();
            const unique = [];
            const duplicates = {};

            allData.forEach(row => {
                const dateKey = row.planned_date?.split('T')[0] || "no-date";
                const seriesKey = `${row.task_description}|${row.name}`;
                const clashKey = `${seriesKey}|${dateKey}`;

                if (!seen.has(seriesKey)) {
                    seen.add(seriesKey);
                    unique.push(row);
                }

                // Track how many tasks exist for EXACTLY the same day
                if (duplicates[clashKey]) {
                    duplicates[clashKey]++;
                    duplicates[seriesKey] = (duplicates[seriesKey] || 0) + 1;
                } else {
                    duplicates[clashKey] = 1;
                }
            });
            setSeriesList(unique);
            setDuplicateStats(duplicates);
            setStatus(`Analysis complete. Found ${unique.length} unique series across ${allData.length} pending tasks in ${activeTab}.`);
        } catch (err) {
            console.error(err);
            setStatus("Fetch failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCleanupDuplicates = async () => {
        if (!window.confirm("Are you sure? This will delete all extra duplicate rows from Checklist, Maintenance, and Delegation tables.")) return;

        setIsLoading(true);
        setStatus("Starting Global Database Cleanup...");
        let totalDeleted = 0;

        try {
            const tables = [
                { name: 'checklist', idField: 'task_id', dateField: 'planned_date' },
                { name: 'delegation', idField: 'task_id', dateField: 'planned_date' },
                { name: 'maintenance_tasks', idField: 'id', dateField: 'planned_date' }
            ];

            for (const table of tables) {
                setStatus(`Scanning entire ${table.name} table (Live & History)...`);
                let allData = [];
                let from = 0;
                let hasMore = true;

                while (hasMore) {
                    // Removed .is('submission_date', null) to include history in cleanup
                    const { data, error } = await supabase.from(table.name).select(`*`).range(from, from + 999);
                    if (error) throw error;
                    allData = [...allData, ...data];
                    if (data.length < 1000) hasMore = false;
                    from += 1000;
                }

                // IMPORTANT: Sort by ID so we always keep the FIRST one created
                allData.sort((a, b) => (a[table.idField] || 0) - (b[table.idField] || 0));

                const seen = new Set();
                const toDelete = [];

                allData.forEach(row => {
                    const dateStr = row[table.dateField]?.split('T')[0] || "no-date";
                    // Identity is Person + Task Description + DATE
                    const key = `${row.name?.trim()}|${row.task_description?.trim()}|${dateStr}`;

                    if (seen.has(key)) {
                        // This is a duplicate (Live or History)
                        toDelete.push(row[table.idField]);
                    } else {
                        // This is the primary record for this date, keep it
                        seen.set(key, true);
                    }
                });

                if (toDelete.length > 0) {
                    setStatus(`Deleting ${toDelete.length} duplicates from ${table.name}...`);
                    // Deleting in chunks of 100 to avoid URL length issues
                    for (let i = 0; i < toDelete.length; i += 100) {
                        const chunk = toDelete.slice(i, i + 100);
                        const { error: delError } = await supabase.from(table.name).delete().in(table.idField, chunk);
                        if (delError) throw delError;
                    }
                    totalDeleted += toDelete.length;
                }
            }

            setStatus(`SUCCESS: Global cleanup complete. Total ${totalDeleted} duplicate rows removed.`);
            fetchUniqueSeries();
        } catch (err) {
            console.error(err);
            setStatus("Cleanup Failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSeriesDetail = async (series) => {
        setIsLoading(true);
        setSelectedSeries(series);
        setAnchorDate("");
        try {
            let allTasks = [];
            let from = 0;
            const step = 1000;
            let hasMore = true;

            // Fetch ALL tasks for this series (including history) using pagination
            while (hasMore) {
                const { data, error } = await supabase
                    .from('checklist')
                    .select('*')
                    .eq('task_description', series.task_description)
                    .eq('name', series.name)
                    .order('task_id', { ascending: true })
                    .range(from, from + step - 1);

                if (error) throw error;
                allTasks = [...allTasks, ...data];
                if (data.length < step) hasMore = false;
                from += step;
            }

            setTasks(allTasks);

            // Auto-set anchor to first unsubmitted task
            const firstUnsubmitted = allTasks.find(t => !t.submission_date);
            if (firstUnsubmitted) {
                setAnchorDate(firstUnsubmitted.planned_date.substring(0, 16));
            }
        } catch (err) {
            setStatus("Error loading details: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getNextDate = (date, frequency) => {
        const next = new Date(date);
        const f = (frequency || 'daily').toLowerCase();
        if (f.includes('daily')) next.setDate(next.getDate() + 1);
        else if (f.includes('weekly')) next.setDate(next.getDate() + 7);
        else if (f.includes('monthly')) next.setMonth(next.getMonth() + 1);
        else if (f.includes('alternate')) next.setDate(next.getDate() + 2);
        else if (f.includes('fortnight')) next.setDate(next.getDate() + 14);
        else next.setDate(next.getDate() + 1);
        return next;
    };

    const isBadDate = (d) => {
        const dateStr = getLocalDateString(d);
        // Is bad if it's a holiday OR if it is NOT in the working day calendar
        return holidays.includes(dateStr) || !workingDays.has(dateStr);
    };

    const handleRepair = async () => {
        if (!anchorDate || !selectedSeries) return;
        setIsLoading(true);
        setStatus("Repairing dates...");

        try {
            const unsubmitted = tasks.filter(t => !t.submission_date).sort((a, b) => a.task_id - b.task_id);
            const timePart = anchorDate.split('T')[1] || "09:00";

            let currentLoopDate = new Date(anchorDate);

            // Validate first date (if manually entered date is a weekend/holiday, find next good day)
            while (isBadDate(currentLoopDate)) {
                currentLoopDate = getNextDate(currentLoopDate, 'daily');
            }

            for (let i = 0; i < unsubmitted.length; i++) {
                const task = unsubmitted[i];

                let targetDate;
                if (i === 0) {
                    targetDate = `${getLocalDateString(currentLoopDate)}T${timePart}:00`;
                } else {
                    let nextDate = getNextDate(currentLoopDate, selectedSeries.frequency);
                    while (isBadDate(nextDate)) {
                        nextDate = getNextDate(nextDate, 'daily');
                    }
                    currentLoopDate = nextDate;
                    targetDate = `${getLocalDateString(currentLoopDate)}T${timePart}:00`;
                }

                await supabase.from('checklist')
                    .update({ planned_date: targetDate, task_start_date: targetDate })
                    .eq('task_id', task.task_id);
            }

            setStatus("Series repaired successfully.");
            loadSeriesDetail(selectedSeries); // refresh list
        } catch (err) {
            setStatus("Repair failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h1 style={{ margin: 0 }}>Task Recovery & Maintenance</h1>
                    <button
                        onClick={handleCleanupDuplicates}
                        disabled={isLoading}
                        style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Cleanup All Duplicates
                    </button>
                </div>
                <p style={{ color: '#666', marginBottom: '20px' }}>Fix series dates or wipe out duplicate rows from all tables.</p>

                {status && (
                    <div style={{ padding: '15px', borderRadius: '4px', backgroundColor: status.includes('Error') ? '#fee2e2' : '#dcfce7', color: status.includes('Error') ? '#991b1b' : '#166534', marginBottom: '20px', fontWeight: 'bold' }}>
                        {status}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '20px' }}>
                    {/* Left Panel: Search & Select */}
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Search description or staff..."
                                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchUniqueSeries(searchTerm)}
                            />
                            <button
                                onClick={() => fetchUniqueSeries(searchTerm)}
                                disabled={isLoading}
                                style={{ padding: '0 15px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Search
                            </button>
                        </div>
                        <div style={{ height: '650px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                            {seriesList.length > 0 ? seriesList.map((s, i) => {
                                const seriesKey = `${s.task_description}|${s.name}`;
                                const dupCount = duplicateStats[seriesKey] || 0;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => loadSeriesDetail(s)}
                                        style={{
                                            padding: '15px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            backgroundColor: selectedSeries === s ? '#eff6ff' : 'white',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '14px', color: '#1e293b' }}>{s.task_description}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#475569' }}>{s.name}</span> | {s.frequency || s.freq}
                                            </div>
                                        </div>
                                        {dupCount > 0 && (
                                            <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>
                                                {dupCount} CLASHES
                                            </span>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                    {isLoading ? 'Searching database...' : 'No results found.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Detail & Fix */}
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', backgroundColor: 'white' }}>
                        {selectedSeries ? (
                            <>
                                <h2 style={{ marginTop: 0 }}>{selectedSeries.task_description}</h2>
                                <p style={{ color: '#666' }}>Staff: {selectedSeries.name} | Frequency: {selectedSeries.frequency}</p>

                                <div style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '4px', backgroundColor: '#f9fafb', marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>New Start Date for First Pending Task:</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="datetime-local"
                                            value={anchorDate}
                                            onChange={(e) => setAnchorDate(e.target.value)}
                                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                                        />
                                        <button
                                            onClick={handleRepair}
                                            disabled={isLoading || !anchorDate}
                                            style={{
                                                padding: '8px 20px',
                                                backgroundColor: '#2563eb',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {isLoading ? 'Processing...' : 'Repair This Series'}
                                        </button>
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Task ID</th>
                                            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Planned Date</th>
                                            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Status / Conflict</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const dateCounter = {};
                                            return tasks.map((t, idx) => {
                                                const dateStr = t.planned_date.split('T')[0];
                                                dateCounter[dateStr] = (dateCounter[dateStr] || 0) + 1;
                                                const isClash = dateCounter[dateStr] > 1;

                                                return (
                                                    <tr key={idx} style={{ backgroundColor: isClash ? '#fff1f2' : 'transparent' }}>
                                                        <td style={{ border: '1px solid #ddd', padding: '10px' }}>#{t.task_id || t.id}</td>
                                                        <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                            {t.planned_date.replace('T', ' ')}
                                                            {isClash && <span style={{ marginLeft: '10px', color: '#e11d48', fontSize: '10px', fontWeight: 'bold' }}>⚠️ DUPLICATE DATE</span>}
                                                        </td>
                                                        <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                                            {t.submission_date ? (
                                                                <span style={{ color: '#059669', fontWeight: 'bold' }}>DONE</span>
                                                            ) : isClash ? (
                                                                <span style={{ color: '#e11d48', fontWeight: 'bold' }}>FOR DELETION</span>
                                                            ) : (
                                                                <span style={{ color: '#d97706', fontWeight: 'bold' }}>PENDING (SERIES)</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
                                Select a task series from the left to view and fix.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
