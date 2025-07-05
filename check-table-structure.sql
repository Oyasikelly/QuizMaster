-- =============================================================================
-- CHECK TABLE STRUCTURE
-- =============================================================================
-- Run this to see what columns your tables have and their data types

-- Check quiz_results table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_results'
ORDER BY ordinal_position;

-- Check users_profile table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users_profile'
ORDER BY ordinal_position;

-- =============================================================================
-- SAMPLE DATA WITH PROPER TYPES
-- =============================================================================

-- Test quiz_results (adjust based on your actual columns)
-- INSERT INTO quiz_results (student_id, quiz_id, score) 
-- VALUES (gen_random_uuid(), 'quiz-001', 85);

-- Test users_profile (adjust based on your actual columns)
-- INSERT INTO users_profile (id, email, name) 
-- VALUES (gen_random_uuid(), 'test@example.com', 'John Doe'); 