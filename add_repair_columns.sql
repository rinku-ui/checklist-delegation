-- Add missing columns to repair_tasks table
DO $$
BEGIN
    -- Add bill_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'bill_amount') THEN
        ALTER TABLE repair_tasks ADD COLUMN bill_amount numeric;
    END IF;

    -- Add part_replaced if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'part_replaced') THEN
        ALTER TABLE repair_tasks ADD COLUMN part_replaced text;
    END IF;

    -- Add remarks if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'remarks') THEN
        ALTER TABLE repair_tasks ADD COLUMN remarks text;
    END IF;

    -- Add vendor_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'vendor_name') THEN
        ALTER TABLE repair_tasks ADD COLUMN vendor_name text;
    END IF;

    -- Add work_done if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'work_done') THEN
        ALTER TABLE repair_tasks ADD COLUMN work_done text;
    END IF;

    -- Add work_photo_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'work_photo_url') THEN
        ALTER TABLE repair_tasks ADD COLUMN work_photo_url text;
    END IF;

    -- Add bill_copy_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'bill_copy_url') THEN
        ALTER TABLE repair_tasks ADD COLUMN bill_copy_url text;
    END IF;

    -- Add submission_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'submission_date') THEN
        ALTER TABLE repair_tasks ADD COLUMN submission_date timestamptz;
    END IF;
END $$;
