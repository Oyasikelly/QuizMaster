-- Ported from create-quiz-settings-table.sql (root). This is the single-row
-- table src/lib/quiz-config.js reads to gate real-quiz/practice-mode state.

create table if not exists quiz_settings (
    id integer primary key default 1,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    is_active boolean default false,
    time integer default 60,
    questions integer default 100,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

insert into quiz_settings (id, start_time, end_time, is_active, time, questions)
values (1, '2024-01-15T20:00:00Z', '2024-01-15T21:00:00Z', false, 60, 100)
on conflict (id) do nothing;

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_quiz_settings_updated_at on quiz_settings;
create trigger update_quiz_settings_updated_at
    before update on quiz_settings
    for each row
    execute function update_updated_at_column();
