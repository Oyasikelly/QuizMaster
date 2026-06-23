-- =============================================================================
-- DEBUG QUIZ_RESULTS TABLE
-- =============================================================================
-- Run this in your Supabase SQL Editor to check table structure and data
-- =============================================================================

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quiz_results'
) as table_exists;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_results'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_results';

-- 4. Check current RLS policies
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
WHERE tablename = 'quiz_results';

-- 5. Check if there are any rows in the table
SELECT COUNT(*) as total_rows FROM quiz_results;

-- 6. Check for any constraints that might be causing issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quiz_results'::regclass;

-- 7. Test a simple insert
-- INSERT INTO quiz_results (student_id, email, name, class, category, score, total_questions, timestamp) 
-- VALUES ('test-student-123', 'test@example.com', 'Test User', 'yaya', 'test-quiz', 5, 10, now());

-- 8. Check recent quiz results
SELECT * FROM quiz_results ORDER BY timestamp DESC LIMIT 5;

-- =============================================================================
-- POSSIBLE FIXES
-- =============================================================================

-- If the table doesn't exist, create it:
-- CREATE TABLE IF NOT EXISTS quiz_results (
--     id SERIAL PRIMARY KEY,
--     student_id UUID NOT NULL,
--     email TEXT,
--     name TEXT,
--     class TEXT,
--     category TEXT,
--     score INTEGER,
--     total_questions INTEGER,
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- If RLS is enabled but no policies exist, disable RLS temporarily:
-- ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;

-- Add RLS policies for quiz_results if needed:
-- CREATE POLICY "Users can insert their own quiz results" ON quiz_results
--     FOR INSERT WITH CHECK (auth.uid() = student_id);

-- CREATE POLICY "Users can view their own quiz results" ON quiz_results
--     FOR SELECT USING (auth.uid() = student_id);

-- =============================================================================
-- INSTRUCTIONS:
-- =============================================================================
-- 
-- 1. Run this script in your Supabase SQL Editor
-- 2. Check the output for any issues
-- 3. If the table doesn't exist, uncomment and run the CREATE TABLE statement
-- 4. If RLS is causing issues, temporarily disable it with the ALTER TABLE command
-- 5. Share the output with me so I can help identify the specific issue
-- 
-- ============================================================================= 