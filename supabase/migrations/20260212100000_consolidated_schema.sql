-- ============================================================
-- Consolidated schema for training-mobile
-- Replaces: init, gym_schema, multi_program, wizard_config
-- ============================================================

-- ============================================================
-- Timestamp trigger (auto-manages created_at / updated_at)
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

-- ============================================================
-- Exercises
-- ============================================================
CREATE TABLE exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own exercises"
  ON exercises FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_exercises_user ON exercises(user_id) WHERE NOT deleted;

-- ============================================================
-- Max Lifts (1RM records)
-- ============================================================
CREATE TABLE max_lifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  date_recorded timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE max_lifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own max_lifts"
  ON max_lifts FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_max_lifts_exercise ON max_lifts(exercise_id) WHERE NOT deleted;

-- ============================================================
-- Programs
-- ============================================================
CREATE TABLE programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  program_type text DEFAULT 'powerlifting',
  weeks_count int DEFAULT 4,
  current_week int DEFAULT 1,
  start_date timestamptz,
  wizard_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own programs"
  ON programs FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_programs_type ON programs(program_type) WHERE NOT deleted;

-- ============================================================
-- Program Weeks
-- ============================================================
CREATE TABLE program_weeks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false,
  UNIQUE(program_id, week_number)
);

ALTER TABLE program_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own program_weeks"
  ON program_weeks FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_program_weeks_program ON program_weeks(program_id) WHERE NOT deleted;

-- ============================================================
-- Workout Days
-- ============================================================
CREATE TABLE workout_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  program_week_id uuid NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own workout_days"
  ON workout_days FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_workout_days_week ON workout_days(program_week_id) WHERE NOT deleted;

-- ============================================================
-- Workout Sets (prescribed)
-- ============================================================
CREATE TABLE workout_sets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  workout_day_id uuid NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number int NOT NULL,
  reps int NOT NULL,
  percentage_of_max numeric,
  rpe numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own workout_sets"
  ON workout_sets FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_workout_sets_day ON workout_sets(workout_day_id) WHERE NOT deleted;
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id) WHERE NOT deleted;

-- ============================================================
-- Workout Sessions (completed workout logs)
-- NOTE: No workout_day_id column. Use session_workout_days
--       junction table for day linking (supports multi-day).
-- ============================================================
CREATE TABLE workout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own workout_sessions"
  ON workout_sessions FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id) WHERE NOT deleted;

-- ============================================================
-- Session Workout Days (junction: session <-> workout days)
-- ============================================================
CREATE TABLE session_workout_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_day_id uuid NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE session_workout_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own session_workout_days"
  ON session_workout_days FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_session_workout_days_session ON session_workout_days(session_id) WHERE NOT deleted;
CREATE INDEX idx_session_workout_days_day ON session_workout_days(workout_day_id) WHERE NOT deleted;

-- ============================================================
-- Set Logs (actual performance)
-- ============================================================
CREATE TABLE set_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  workout_session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_set_id uuid REFERENCES workout_sets(id) ON DELETE SET NULL,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  reps_completed int NOT NULL,
  rpe numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own set_logs"
  ON set_logs FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_set_logs_session ON set_logs(workout_session_id) WHERE NOT deleted;
CREATE INDEX idx_set_logs_exercise ON set_logs(exercise_id) WHERE NOT deleted;

-- ============================================================
-- Workout Templates (saved workout combos)
-- ============================================================
CREATE TABLE workout_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workout_templates"
  ON workout_templates FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Template Items (exercises in a template)
-- ============================================================
CREATE TABLE template_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_day_id uuid REFERENCES workout_days(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  reps integer NOT NULL,
  percentage_of_max numeric,
  rpe numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own template_items"
  ON template_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_template_items_template ON template_items(template_id) WHERE NOT deleted;

-- ============================================================
-- Apply timestamp trigger to all tables
-- ============================================================
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

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON session_workout_days
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON set_logs
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON workout_templates
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

CREATE TRIGGER handle_times BEFORE INSERT OR UPDATE ON template_items
  FOR EACH ROW EXECUTE PROCEDURE handle_times();

-- ============================================================
-- Enable realtime on all tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE exercises;
ALTER PUBLICATION supabase_realtime ADD TABLE max_lifts;
ALTER PUBLICATION supabase_realtime ADD TABLE programs;
ALTER PUBLICATION supabase_realtime ADD TABLE program_weeks;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_days;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_workout_days;
ALTER PUBLICATION supabase_realtime ADD TABLE set_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_items;
