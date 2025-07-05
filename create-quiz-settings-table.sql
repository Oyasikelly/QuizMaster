-- =============================================================================
-- CREATE QUIZ SETTINGS TABLE
-- =============================================================================
-- 
-- This table stores the quiz configuration settings
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Create quiz_settings table
CREATE TABLE IF NOT EXISTS quiz_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    time INTEGER DEFAULT 60,
    questions INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO quiz_settings (id, start_time, end_time, is_active, time, questions)
VALUES (
    1,
    '2024-01-15T20:00:00Z',
    '2024-01-15T21:00:00Z',
    false,
    60,
    100
) ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quiz_settings_updated_at 
    BEFORE UPDATE ON quiz_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USAGE:
-- =============================================================================
-- 
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The admin panel will use this table to store quiz settings
-- 3. The quiz system will read from this table to determine restrictions
-- ============================================================================= 