-- =============================================================================
-- FIX QUIZ RESULTS TABLE ISSUES
-- =============================================================================
-- Run this in your Supabase SQL Editor to diagnose and fix issues
-- =============================================================================

-- 1. Check if table exists
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

-- 3. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_results';

-- 4. Check RLS policies
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

-- 5. Temporarily disable RLS if it's causing issues
-- ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;

-- 6. Create proper RLS policies if needed
-- DROP POLICY IF EXISTS "Users can insert their own quiz results" ON quiz_results;
-- CREATE POLICY "Users can insert their own quiz results" ON quiz_results
--     FOR INSERT WITH CHECK (auth.uid() = student_id);

-- DROP POLICY IF EXISTS "Users can view their own quiz results" ON quiz_results;
-- CREATE POLICY "Users can view their own quiz results" ON quiz_results
--     FOR SELECT USING (auth.uid() = student_id);

-- 7. Check for any constraints that might be causing issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quiz_results'::regclass;

-- 8. Test insert with minimal data
-- INSERT INTO quiz_results (student_id, score, total_questions, timestamp) 
-- VALUES ('test-user-123', 85, 100, now())
-- ON CONFLICT DO NOTHING;

-- 9. Check if there are any existing records
SELECT COUNT(*) as total_records FROM quiz_results;

-- 10. Show recent records
SELECT * FROM quiz_results ORDER BY timestamp DESC LIMIT 5;

-- =============================================================================
-- POSSIBLE FIXES:
-- =============================================================================

-- If RLS is enabled but no policies exist, either:
-- 1. Disable RLS: ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;
-- 2. Or create proper policies (see above)

-- If table doesn't exist, create it:
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

-- =============================================================================
-- INSTRUCTIONS:
-- =============================================================================
-- 
-- 1. Run this script and check the output
-- 2. If RLS is enabled but no policies exist, uncomment the ALTER TABLE line
-- 3. If the table doesn't exist, uncomment the CREATE TABLE statement
-- 4. If there are constraint issues, check the constraint definitions
-- 5. Share the output with me for further diagnosis
-- 
-- ============================================================================= 