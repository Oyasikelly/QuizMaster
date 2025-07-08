-- =============================================================================
-- ADD PRACTICE MODE FIELD TO QUIZ SETTINGS
-- =============================================================================
-- Run this in your Supabase SQL Editor to add practice_mode field
-- =============================================================================

-- Add practice_mode column to quiz_settings table
ALTER TABLE quiz_settings 
ADD COLUMN IF NOT EXISTS practice_mode BOOLEAN DEFAULT false;

-- Update existing records to have practice_mode = false (strict quiz mode by default)
UPDATE quiz_settings 
SET practice_mode = false 
WHERE practice_mode IS NULL;

-- Add comment to explain the field
COMMENT ON COLUMN quiz_settings.practice_mode IS 'When true, allows practice mode. When false, only real quiz mode is available.';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify the field was added correctly
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_settings' 
AND column_name = 'practice_mode';

-- =============================================================================
-- USAGE:
-- =============================================================================
-- 
-- 1. Set practice_mode = true to allow practice mode
-- UPDATE quiz_settings SET practice_mode = true WHERE id = 1;
--
-- 2. Set practice_mode = false to force real quiz mode only
-- UPDATE quiz_settings SET practice_mode = false WHERE id = 1;
--
-- 3. Check current setting
-- SELECT practice_mode FROM quiz_settings WHERE id = 1;
-- ============================================================================= 