-- Ported from add-practice-mode-field.sql (root). Gates practice mode
-- availability, read by src/lib/quiz-config.js (isPracticeModeEnabled).

alter table quiz_settings
add column if not exists practice_mode boolean default false;

update quiz_settings
set practice_mode = false
where practice_mode is null;

comment on column quiz_settings.practice_mode is
    'When true, allows practice mode. When false, only real quiz mode is available.';
