-- ============================================================
-- ADD admin_done COLUMN TO repair_tasks TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE repair_tasks 
ADD COLUMN IF NOT EXISTS admin_done BOOLEAN DEFAULT FALSE;

-- Optional: Update existing 'Approved' tasks to have admin_done = true
UPDATE repair_tasks 
SET admin_done = TRUE 
WHERE status = 'Approved' OR status = 'Completed';

-- Optional: Ensure ea_tasks also has it (it should, but just in case)
-- ALTER TABLE ea_tasks ADD COLUMN IF NOT EXISTS admin_done BOOLEAN DEFAULT FALSE;

-- ============================================================
-- DONE!
-- ============================================================
