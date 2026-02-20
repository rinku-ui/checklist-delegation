-- ============================================================
-- SUPABASE PASSWORD HASHING SETUP
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable the pgcrypto extension for hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create a function to hash passwords automatically
-- This ensures that any password saved via 'users' table 
-- (insert or update) is hashed using Blowfish (bf) algorithm.
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if it's a new row or the password has changed
  -- and it doesn't look like a hash already (simple check)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.password <> OLD.password) THEN
    -- Only hash if the string doesn't start with '$2a$' (a common bcrypt/blowfish prefix)
    IF NEW.password NOT LIKE '$2a$%' THEN
      NEW.password = crypt(NEW.password, gen_salt('bf', 10));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger on the users table
DROP TRIGGER IF EXISTS tr_hash_password ON users;
CREATE TRIGGER tr_hash_password
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION hash_password();

-- 4. Create a secure login RPC (Remote Procedure Call)
-- This allows the frontend to verify passwords without fetching them
CREATE OR REPLACE FUNCTION secure_login(input_username TEXT, input_password TEXT)
RETURNS TABLE (
  id BIGINT, 
  user_name TEXT, 
  role TEXT, 
  user_access TEXT, 
  status TEXT, 
  email_id TEXT,
  number TEXT,
  employee_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::BIGINT,        -- Explicitly cast to BIGINT
    u.user_name::TEXT, 
    u.role::TEXT,        -- Cast Enum to Text
    u.user_access::TEXT, 
    u.status::TEXT,      -- Cast Enum to Text
    u.email_id::TEXT,
    u.number::TEXT,
    u.employee_id::TEXT
  FROM users u
  WHERE (u.user_name = input_username OR u.email_id = input_username)
    AND u.password = crypt(input_password, u.password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. IMPORTANT: Hash existing plain-text passwords
-- WARNING: Run this ONLY ONCE. 
-- Make sure all current passwords are plain text before running this.
-- UPDATE users SET password = crypt(password, gen_salt('bf', 10)) 
-- WHERE password NOT LIKE '$2a$%';

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
