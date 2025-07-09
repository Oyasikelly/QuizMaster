-- =============================================================================
-- FIX ROW LEVEL SECURITY FOR QUIZ SETTINGS TABLE
-- =============================================================================
-- Run this in your Supabase SQL Editor to fix RLS policies
-- =============================================================================

-- First, let's check if RLS is enabled on the quiz_settings table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_settings';

-- If RLS is enabled, we need to create policies for admin access
-- Let's create a policy that allows authenticated users to read quiz_settings
CREATE POLICY "Allow authenticated users to read quiz_settings" ON quiz_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create a policy that allows authenticated users to insert quiz_settings
CREATE POLICY "Allow authenticated users to insert quiz_settings" ON quiz_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create a policy that allows authenticated users to update quiz_settings
CREATE POLICY "Allow authenticated users to update quiz_settings" ON quiz_settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy that allows authenticated users to delete quiz_settings
CREATE POLICY "Allow authenticated users to delete quiz_settings" ON quiz_settings
    FOR DELETE
    TO authenticated
    USING (true);

-- =============================================================================
-- ALTERNATIVE: DISABLE RLS IF NOT NEEDED
-- =============================================================================
-- If you don't need RLS for this table, you can disable it:
-- ALTER TABLE quiz_settings DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quiz_settings';

-- Test if we can insert a row (this should work after applying policies)
-- INSERT INTO quiz_settings (id, is_active, time, questions, practice_mode) 
-- VALUES (1, false, 60, 100, false) 
-- ON CONFLICT (id) DO UPDATE SET 
--     is_active = EXCLUDED.is_active,
--     time = EXCLUDED.time,
--     questions = EXCLUDED.questions,
--     practice_mode = EXCLUDED.practice_mode;

-- =============================================================================
-- USAGE:
-- =============================================================================
-- 
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The policies will allow authenticated users to read/write quiz_settings
-- 3. Your admin panel should now be able to save settings
-- ============================================================================= 