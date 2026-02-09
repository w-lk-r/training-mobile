-- Drop the demo todos table
drop trigger if exists handle_times on todos;
drop table if exists todos;

-- ============================================================
-- Exercises
-- ============================================================
create table exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  category text, -- e.g. 'squat', 'bench', 'deadlift', 'press', 'accessory'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table exercises enable row level security;
create policy "Users can CRUD their own exercises"
  on exercises for all using (user_id = auth.uid());

-- ============================================================
-- Max Lifts (1RM records)
-- ============================================================
create table max_lifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  exercise_id uuid references exercises(id) not null,
  weight_kg numeric not null,
  date_recorded timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table max_lifts enable row level security;
create policy "Users can CRUD their own max_lifts"
  on max_lifts for all using (user_id = auth.uid());

-- ============================================================
-- Programs
-- ============================================================
create table programs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  weeks_count int default 4,
  current_week int default 1,
  start_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table programs enable row level security;
create policy "Users can CRUD their own programs"
  on programs for all using (user_id = auth.uid());

-- ============================================================
-- Program Weeks
-- ============================================================
create table program_weeks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  program_id uuid references programs(id) not null,
  week_number int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  unique(program_id, week_number)
);

alter table program_weeks enable row level security;
create policy "Users can CRUD their own program_weeks"
  on program_weeks for all using (user_id = auth.uid());

-- ============================================================
-- Workout Days
-- ============================================================
create table workout_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  program_week_id uuid references program_weeks(id) not null,
  day_number int not null,
  name text, -- e.g. 'Squat Day', 'Bench Day'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table workout_days enable row level security;
create policy "Users can CRUD their own workout_days"
  on workout_days for all using (user_id = auth.uid());

-- ============================================================
-- Workout Sets (prescribed)
-- ============================================================
create table workout_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  workout_day_id uuid references workout_days(id) not null,
  exercise_id uuid references exercises(id) not null,
  set_number int not null,
  reps int not null,
  percentage_of_max numeric, -- e.g. 0.75 for 75%
  rpe numeric, -- Rate of Perceived Exertion target
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table workout_sets enable row level security;
create policy "Users can CRUD their own workout_sets"
  on workout_sets for all using (user_id = auth.uid());

-- ============================================================
-- Workout Sessions (completed workout logs)
-- ============================================================
create table workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  workout_day_id uuid references workout_days(id),
  completed_at timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table workout_sessions enable row level security;
create policy "Users can CRUD their own workout_sessions"
  on workout_sessions for all using (user_id = auth.uid());

-- ============================================================
-- Set Logs (actual performance)
-- ============================================================
create table set_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  workout_session_id uuid references workout_sessions(id) not null,
  workout_set_id uuid references workout_sets(id),
  exercise_id uuid references exercises(id) not null,
  weight_kg numeric not null,
  reps_completed int not null,
  rpe numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

alter table set_logs enable row level security;
create policy "Users can CRUD their own set_logs"
  on set_logs for all using (user_id = auth.uid());

-- ============================================================
-- Timestamp trigger (reuse pattern from init migration)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_times()
  RETURNS trigger AS
$$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_at := now();
    NEW.updated_at := now();
  ELSEIF (TG_OP = 'UPDATE') THEN
    NEW.created_at = OLD.created_at;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON max_lifts
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON programs
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON program_weeks
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON workout_days
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON workout_sets
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON set_logs
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

-- ============================================================
-- Enable realtime on all tables
-- ============================================================
alter publication supabase_realtime add table exercises;
alter publication supabase_realtime add table max_lifts;
alter publication supabase_realtime add table programs;
alter publication supabase_realtime add table program_weeks;
alter publication supabase_realtime add table workout_days;
alter publication supabase_realtime add table workout_sets;
alter publication supabase_realtime add table workout_sessions;
alter publication supabase_realtime add table set_logs;
