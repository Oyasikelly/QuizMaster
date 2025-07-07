-- Add role column to users_profile table
-- Run this in your Supabase SQL Editor

-- Check if role column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users_profile ADD COLUMN role TEXT DEFAULT 'student';
    END IF;
END $$;

-- Update existing users to have 'student' role if they don't have one
UPDATE users_profile 
SET role = 'student' 
WHERE role IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name = 'role'; 