-- ============================================================
-- ADD PLANNED_DATE COLUMN TO TASK TABLES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add column to Checklist & Delegation
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS planned_date TEXT DEFAULT NULL;
ALTER TABLE delegation ADD COLUMN IF NOT EXISTS planned_date TEXT DEFAULT NULL;

-- 2. Add column to Maintenance
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS planned_date TEXT DEFAULT NULL;

-- 3. Add column to Repair (Optional, likely not used but good for consistency)
ALTER TABLE repair_tasks ADD COLUMN IF NOT EXISTS planned_date TEXT DEFAULT NULL;

-- ============================================================
-- BACKFILL EXISTING DATA
-- We assume the existing 'task_start_date' IS the planned date.
-- ============================================================

UPDATE checklist 
SET planned_date = task_start_date 
WHERE planned_date IS NULL;

UPDATE delegation 
SET planned_date = task_start_date 
WHERE planned_date IS NULL;

UPDATE maintenance_tasks 
SET planned_date = task_start_date 
WHERE planned_date IS NULL;

-- ============================================================
-- DONE!
-- ============================================================
