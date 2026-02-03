-- Add layout_type enum for room layout type
CREATE TYPE room_layout_type AS ENUM ('open', 'fixed');

-- Add new columns to rooms table
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS name_th TEXT,
  ADD COLUMN IF NOT EXISTS layout_type room_layout_type DEFAULT 'open';