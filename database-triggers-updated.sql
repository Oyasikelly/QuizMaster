-- =============================================================================
-- DATABASE TRIGGERS FOR TABLE UPDATES
-- =============================================================================
-- 
-- These triggers will send notifications to your Edge Function
-- whenever there are INSERT, UPDATE, or DELETE operations on your tables.
-- 
-- Replace 'your-project-ref' with your actual Supabase project reference
-- =============================================================================

-- Function to notify the Edge Function about table changes
create or replace function notify_table_change()
returns trigger
language plpgsql
as $$
declare
  response json;
  operation text;
  table_name text;
  new_data json;
  old_data json;
begin
  -- Determine the operation type
  if (TG_OP = 'INSERT') then
    operation := 'INSERT';
  elsif (TG_OP = 'UPDATE') then
    operation := 'UPDATE';
  elsif (TG_OP = 'DELETE') then
    operation := 'DELETE';
  end if;
  
  -- Get table name
  table_name := TG_TABLE_NAME;
  
  -- Convert data to JSON
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    new_data := to_json(NEW);
  end if;
  
  if (TG_OP = 'UPDATE' or TG_OP = 'DELETE') then
    old_data := to_json(OLD);
  end if;
  
  -- Send notification to Edge Function
  select
    http_post(
      'https://eubroxxcchuozvpcwbdv.functions.supabase.co/table-notifications',
      json_build_object(
        'table_name', table_name,
        'operation', operation,
        'data', new_data,
        'old_data', old_data
      )::text,
      'application/json'
    )
  into response;

  return coalesce(NEW, OLD);
end;
$$;

-- =============================================================================
-- TRIGGERS FOR QUIZ_RESULTS TABLE
-- =============================================================================

-- Trigger for INSERT operations on quiz_results
create trigger quiz_results_insert_trigger
  after insert on quiz_results
  for each row
  execute function notify_table_change();

-- Trigger for UPDATE operations on quiz_results
create trigger quiz_results_update_trigger
  after update on quiz_results
  for each row
  execute function notify_table_change();

-- Trigger for DELETE operations on quiz_results
create trigger quiz_results_delete_trigger
  after delete on quiz_results
  for each row
  execute function notify_table_change();

-- =============================================================================
-- TRIGGERS FOR USERS_PROFILE TABLE
-- =============================================================================

-- Trigger for INSERT operations on users_profile
create trigger users_profile_insert_trigger
  after insert on users_profile
  for each row
  execute function notify_table_change();

-- Trigger for UPDATE operations on users_profile
create trigger users_profile_update_trigger
  after update on users_profile
  for each row
  execute function notify_table_change();

-- Trigger for DELETE operations on users_profile
create trigger users_profile_delete_trigger
  after delete on users_profile
  for each row
  execute function notify_table_change();

-- =============================================================================
-- USAGE INSTRUCTIONS:
-- =============================================================================
-- 
-- 1. Replace 'your-project-ref' with your actual Supabase project reference
--    (e.g., 'eubroxxcchuozvpcwbdv')
-- 
-- 2. Run this SQL in your Supabase SQL Editor
-- 
-- 3. Test by inserting/updating/deleting records in your tables:
-- 
--    -- Test quiz_results
--    INSERT INTO quiz_results (student_id, quiz_id, score) 
--    VALUES ('test-123', 'quiz-001', 85);
--    
--    -- Test users_profile
--    INSERT INTO users_profile (id, email, name) 
--    VALUES ('user-123', 'test@example.com', 'John Doe');
-- 
-- 4. Check your Edge Function logs to see the notifications
-- ============================================================================= 