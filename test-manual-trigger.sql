-- =============================================================================
-- MANUAL TEST FOR EMAIL NOTIFICATIONS
-- =============================================================================
-- 
-- Run this SQL to manually test the email notifications
-- =============================================================================

-- Test 1: Insert a quiz result
INSERT INTO quiz_results (student_id, score, total_questions, timestamp) 
VALUES ('manual-test-student-123', 7, 10, now());

-- Test 2: Insert a user profile
INSERT INTO users_profile (id, email, name, class) 
VALUES ('manual-test-user', 'manual-test@example.com', 'Manual Test User', 'Test Class');

-- Test 3: Update a quiz result
UPDATE quiz_results 
SET score = 9, total_questions = 10 
WHERE student_id = 'manual-test-student-123';

-- =============================================================================
-- CHECK RESULTS:
-- =============================================================================
-- 
-- 1. Check your email at quizmasterofficial2024@gmail.com
-- 2. Check Edge Function logs in Supabase Dashboard
-- 3. You should receive 3 email notifications
-- ============================================================================= 