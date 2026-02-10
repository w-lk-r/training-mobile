-- Add program_type column to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type text DEFAULT 'powerlifting';

-- Set existing programs to powerlifting
UPDATE programs SET program_type = 'powerlifting' WHERE program_type IS NULL;

-- Session-to-workout-day junction table for multi-day sessions
CREATE TABLE IF NOT EXISTS session_workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  workout_day_id uuid NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

-- Workout templates (saved workout combos)
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

-- Template items (exercises in a template with ordering)
CREATE TABLE IF NOT EXISTS template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id),
  workout_day_id uuid REFERENCES workout_days(id),
  sort_order integer NOT NULL DEFAULT 0,
  reps integer NOT NULL,
  percentage_of_max numeric,
  rpe numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false
);

-- RLS policies
ALTER TABLE session_workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own session_workout_days"
  ON session_workout_days FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workout_templates"
  ON workout_templates FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own template_items"
  ON template_items FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_workout_days_session ON session_workout_days(session_id) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_template_items_template ON template_items(template_id) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(program_type) WHERE NOT deleted;
