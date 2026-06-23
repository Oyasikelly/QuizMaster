-- =============================================================================
-- DISABLE ROW LEVEL SECURITY FOR QUIZ SETTINGS TABLE
-- =============================================================================
-- Run this in your Supabase SQL Editor to disable RLS
-- =============================================================================

-- Disable Row Level Security on quiz_settings table
ALTER TABLE quiz_settings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_settings';

-- =============================================================================
-- USAGE:
-- =============================================================================
-- 
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. RLS will be disabled for the quiz_settings table
-- 3. Your admin panel should now be able to save settings
-- 
-- NOTE: This disables security for this table. Only use if you trust
-- all authenticated users to manage quiz settings.
-- ============================================================================= 