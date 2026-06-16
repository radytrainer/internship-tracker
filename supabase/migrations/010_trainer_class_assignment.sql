-- Add trainer assignment to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON classes(trainer_id);
