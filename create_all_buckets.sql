-- Create 'repair' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('repair', 'repair', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'maintenance' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance', 'maintenance', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'checklist' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist', 'checklist', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'ea' bucket (if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ea', 'ea', true)
ON CONFLICT (id) DO NOTHING;


-- Set up public access policies (simplest approach for now)
-- REPAIR
CREATE POLICY "Public Access Repair"
ON storage.objects FOR SELECT
USING ( bucket_id = 'repair' );

CREATE POLICY "Public Insert Repair"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'repair' );

-- MAINTENANCE
CREATE POLICY "Public Access Maintenance"
ON storage.objects FOR SELECT
USING ( bucket_id = 'maintenance' );

CREATE POLICY "Public Insert Maintenance"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'maintenance' );

-- CHECKLIST
CREATE POLICY "Public Access Checklist"
ON storage.objects FOR SELECT
USING ( bucket_id = 'checklist' );

CREATE POLICY "Public Insert Checklist"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'checklist' );

-- EA
CREATE POLICY "Public Access EA"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ea' );

CREATE POLICY "Public Insert EA"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'ea' );
