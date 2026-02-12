-- Store the wizard configuration on programs so users can edit their progression later
ALTER TABLE programs ADD COLUMN IF NOT EXISTS wizard_config jsonb;
