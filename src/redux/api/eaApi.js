import supabase from '../../SupabaseClient';

// Fetch all EA tasks (pending)
export const fetchEATasks = async () => {
    try {
        const { data, error } = await supabase
            .from('ea_tasks')
            .select('*')
            .in('status', ['pending', 'extend', 'extended', 'Pending'])
            .order('planned_date', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => ({ ...row, id: row.task_id }));
    } catch (err) {
        console.error('Error fetching EA tasks:', err);
        return [];
    }
};

// Fetch EA task history (completed/approved) from ea_tasks_done
export const fetchEATasksHistory = async () => {
    try {
        const { data: doneData, error } = await supabase
            .from('ea_tasks_done')
            .select('*')
            .in('status', ['done', 'approved', 'Approved', 'Done', 'extended', 'Extended'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!doneData || doneData.length === 0) return [];

        const taskIds = doneData.map(d => d.task_id).filter(id => id);
        let taskDetails = [];
        if (taskIds.length > 0) {
            const { data: details, error: detailsError } = await supabase
                .from('ea_tasks')
                .select('*')
                .in('task_id', taskIds);
            if (!detailsError) taskDetails = details;
        }

        return doneData.map(doneItem => {
            const detail = taskDetails.find(t => t.task_id === doneItem.task_id);
            return {
                ...detail,
                ...doneItem,
                id: doneItem.task_id,
                department: "EA"
            };
        });
    } catch (err) {
        console.error('Error fetching EA task history:', err);
        return [];
    }
};

// Create a new EA task
export const createEATask = async (taskData) => {
    try {
        const { data, error } = await supabase
            .from('ea_tasks')
            .insert([taskData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error creating EA task:', err);
        return { success: false, error: err.message };
    }
};

// Update EA task status
export const updateEATask = async (taskId, updates) => {
    try {
        const { data, error } = await supabase
            .from('ea_tasks')
            .update(updates)
            .eq('task_id', taskId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error updating EA task:', err);
        return { success: false, error: err.message };
    }
};

// Complete EA task (mark for admin approval)
export const completeEATask = async (task, remarks = '', imageUrl = '') => {
    try {
        const givenBy = localStorage.getItem("user-name") || "Admin";

        // 1. Insert into ea_tasks_done
        const { error: doneError } = await supabase
            .from('ea_tasks_done')
            .insert([{
                task_id: task.id || task.task_id,
                status: 'pending', // Waiting for admin approval
                remarks: remarks,
                image_url: imageUrl,
                given_by: givenBy
            }]);
        if (doneError) throw doneError;

        // 2. Update ea_tasks
        const { data, error } = await supabase
            .from('ea_tasks')
            .update({
                status: 'done',
                remarks: remarks,
                image_url: imageUrl,
                admin_done: false,
                updated_at: new Date().toISOString()
            })
            .eq('task_id', task.id || task.task_id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error completing EA task:', err);
        return { success: false, error: err.message };
    }
};

// Extend EA task deadline
export const extendEATask = async (task, newPlannedDate, remarks = '') => {
    try {
        const givenBy = localStorage.getItem("user-name") || "Admin";

        // 1. Insert into ea_tasks_done as an 'extend' record
        const { error: doneError } = await supabase
            .from('ea_tasks_done')
            .insert([{
                task_id: task.id || task.task_id,
                status: 'extended',
                remarks: remarks,
                given_by: givenBy
            }]);
        if (doneError) throw doneError;

        // 2. Update ea_tasks
        const { data, error } = await supabase
            .from('ea_tasks')
            .update({
                planned_date: newPlannedDate,
                status: 'extended',
                remarks: remarks,
                updated_at: new Date().toISOString()
            })
            .eq('task_id', task.id || task.task_id)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error extending EA task:', err);
        return { success: false, error: err.message };
    }
};

// Delete EA task
export const deleteEATask = async (taskId) => {
    try {
        const { error } = await supabase
            .from('ea_tasks')
            .delete()
            .eq('task_id', taskId);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error deleting EA task:', err);
        return { success: false, error: err.message };
    }
};

export const fetchPendingEAApprovals = async () => {
    try {
        // Fetch pending completions from ea_tasks_done
        const { data: doneData, error } = await supabase
            .from('ea_tasks_done')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!doneData || doneData.length === 0) return [];

        const taskIds = doneData.map(d => d.task_id).filter(id => id);
        let taskDetails = [];
        if (taskIds.length > 0) {
            const { data: details, error: detailsError } = await supabase
                .from('ea_tasks')
                .select('*')
                .in('task_id', taskIds);
            if (!detailsError) taskDetails = details;
        }

        return doneData.map(doneItem => {
            const detail = taskDetails.find(t => t.task_id === doneItem.task_id);
            return {
                ...detail,
                ...doneItem,
                done_id: doneItem.id, // Record the entry ID from ea_tasks_done
                id: doneItem.task_id,
                department: "EA"
            };
        });
    } catch (error) {
        console.error("Error fetching pending EA approvals:", error);
        return [];
    }
};

export const approveEATaskV2 = async (id, doneId) => {
    console.log("APPROVING EA TASK WITH ID:", id, "DONE_ID:", doneId);
    try {
        // 1. Update ea_tasks_done
        if (doneId) {
            await supabase
                .from('ea_tasks_done')
                .update({ status: 'done', updated_at: new Date().toISOString() })
                .eq('id', doneId);
        }

        // 2. Update ea_tasks
        const { data, error } = await supabase
            .from('ea_tasks')
            .update({
                admin_done: true,
                status: 'done',
                updated_at: new Date().toISOString()
            })
            .eq('task_id', id)
            .select();

        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("Error in approveEATaskV2:", error);
        throw error;
    }
};

export const rejectEATask = async (id, doneId, reason) => {
    try {
        // 1. Mark ea_tasks_done as rejected
        if (doneId) {
            await supabase
                .from('ea_tasks_done')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', doneId);
        }

        // 2. Reset ea_tasks
        const { data, error } = await supabase
            .from('ea_tasks')
            .update({
                admin_done: false,
                status: 'pending',
                remarks: reason,
                updated_at: new Date().toISOString()
            })
            .eq('task_id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error rejecting EA task:", error);
        throw error;
    }
};

export const fetchApprovedEA = async () => {
    try {
        const { data, error } = await supabase
            .from('ea_tasks')
            .select('*')
            .eq('admin_done', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => ({ ...row, id: row.task_id, department: "EA" }));
    } catch (error) {
        console.error("Error fetching approved EA tasks:", error);
        return [];
    }
};

