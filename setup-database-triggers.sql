-- =============================================================================
-- SETUP DATABASE TRIGGERS FOR EMAIL NOTIFICATIONS
-- =============================================================================
-- 
-- Run this SQL in your Supabase SQL Editor to set up triggers
-- that will send notifications to your Edge Function when tables are updated.
-- =============================================================================

-- First, enable the http extension if not already enabled
create extension if not exists http with schema extensions;

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
  -- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
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

-- Drop existing triggers if they exist
drop trigger if exists quiz_results_insert_trigger on quiz_results;
drop trigger if exists quiz_results_update_trigger on quiz_results;
drop trigger if exists quiz_results_delete_trigger on quiz_results;

-- Create new triggers for quiz_results
create trigger quiz_results_insert_trigger
  after insert on quiz_results
  for each row
  execute function notify_table_change();

create trigger quiz_results_update_trigger
  after update on quiz_results
  for each row
  execute function notify_table_change();

create trigger quiz_results_delete_trigger
  after delete on quiz_results
  for each row
  execute function notify_table_change();

-- =============================================================================
-- TRIGGERS FOR USERS_PROFILE TABLE
-- =============================================================================

-- Drop existing triggers if they exist
drop trigger if exists users_profile_insert_trigger on users_profile;
drop trigger if exists users_profile_update_trigger on users_profile;
drop trigger if exists users_profile_delete_trigger on users_profile;

-- Create new triggers for users_profile
create trigger users_profile_insert_trigger
  after insert on users_profile
  for each row
  execute function notify_table_change();

create trigger users_profile_update_trigger
  after update on users_profile
  for each row
  execute function notify_table_change();

create trigger users_profile_delete_trigger
  after delete on users_profile
  for each row
  execute function notify_table_change();

-- =============================================================================
-- TEST THE TRIGGERS
-- =============================================================================

-- Test quiz_results trigger
INSERT INTO quiz_results (student_id, score, total_questions, timestamp) 
VALUES ('test-user-123', 8, 10, now());

-- Test users_profile trigger  
INSERT INTO users_profile (id, email, name, class) 
VALUES ('test-user-123', 'test@example.com', 'Test User', 'Test Class');

-- =============================================================================
-- INSTRUCTIONS:
-- =============================================================================
-- 
-- 1. Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
--    (Find this in your Supabase Dashboard → Settings → API)
-- 
-- 2. Run this entire SQL script in your Supabase SQL Editor
-- 
-- 3. Check your Edge Function logs to see if the triggers are working
-- 
-- 4. Check your email at quizmasterofficial2024@gmail.com for notifications
-- ============================================================================= 