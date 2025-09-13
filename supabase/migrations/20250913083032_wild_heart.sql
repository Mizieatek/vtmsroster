/*
  # Complete Database Schema for Roster Management System

  1. New Tables
    - `users` - User accounts and profiles
    - `teams` - Team groupings for staff
    - `shifts` - Individual shift assignments
    - `shift_exchanges` - Shift exchange requests
    - `events` - Calendar events and holidays
    - `staff_ordering` - Monthly staff ordering preferences
    - `roster_patterns` - Shift patterns for automatic generation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only policies for management functions

  3. Functions
    - Auto-generate roster function
    - Staff ordering management
    - Exchange request handling
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE,
  full_name text NOT NULL,
  grade text NOT NULL CHECK (grade IN ('PP4', 'PP6')),
  phone text,
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  pp4_user_id uuid REFERENCES users(id),
  pp6_user_id uuid REFERENCES users(id) NOT NULL,
  pp6_user_2_id uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) NOT NULL,
  date date NOT NULL,
  shift_code text NOT NULL CHECK (shift_code IN ('N', 'M', 'E', 'O', 'MOT', 'NOT', 'AL', 'CTR', 'CG', 'EL', 'TR', 'MT', 'MC')),
  team_id uuid REFERENCES teams(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Shift exchanges table
CREATE TABLE IF NOT EXISTS shift_exchanges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id uuid REFERENCES users(id) NOT NULL,
  target_user_id uuid REFERENCES users(id) NOT NULL,
  original_shift_id uuid REFERENCES shifts(id) NOT NULL,
  target_shift_id uuid REFERENCES shifts(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  admin_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  type text DEFAULT 'other' CHECK (type IN ('holiday', 'training', 'meeting', 'other')),
  is_recurring boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff ordering table (for monthly arrangements)
CREATE TABLE IF NOT EXISTS staff_ordering (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year text NOT NULL, -- Format: YYYY-MM
  user_id uuid REFERENCES users(id) NOT NULL,
  order_position integer NOT NULL,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month_year, user_id),
  UNIQUE(month_year, order_position)
);

-- Roster patterns table
CREATE TABLE IF NOT EXISTS roster_patterns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  pattern jsonb NOT NULL, -- Array of shift codes
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_ordering ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Admins can manage users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for teams table
CREATE POLICY "Users can read teams" ON teams
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for shifts table
CREATE POLICY "Users can read all shifts" ON shifts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can read own shifts" ON shifts
  FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage shifts" ON shifts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for shift_exchanges table
CREATE POLICY "Users can read relevant exchanges" ON shift_exchanges
  FOR SELECT TO authenticated
  USING (requester_id::text = auth.uid()::text OR target_user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Users can create exchange requests" ON shift_exchanges
  FOR INSERT TO authenticated
  WITH CHECK (requester_id::text = auth.uid()::text);

CREATE POLICY "Users can update own requests" ON shift_exchanges
  FOR UPDATE TO authenticated
  USING (requester_id::text = auth.uid()::text OR target_user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for events table
CREATE POLICY "Users can read events" ON events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage events" ON events
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for staff_ordering table
CREATE POLICY "Users can read staff ordering" ON staff_ordering
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage staff ordering" ON staff_ordering
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for roster_patterns table
CREATE POLICY "Users can read patterns" ON roster_patterns
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage patterns" ON roster_patterns
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- Insert default roster pattern
INSERT INTO roster_patterns (name, pattern, is_default) VALUES 
('Default 15-day Pattern', '["N", "N", "N", "O", "O", "E", "E", "E", "O", "O", "M", "M", "M", "O", "O"]', true);

-- Insert sample users (you should change passwords in production)
INSERT INTO users (username, email, full_name, grade, is_admin) VALUES 
('raja', 'raja@example.com', 'RAJA AHMAD ZUHAIRI BIN RAJA OTHMAN', 'PP4', true),
('hurul', 'hurul@example.com', 'HURUL AZIELLA BINTI HARIS', 'PP4', false),
('faeez', 'faeez@example.com', 'KHAIRUL FAEEZ BIN MD.IDROS', 'PP4', false),
('farid', 'farid@example.com', 'MOHAMAD FARID BIN ZULKIFLI', 'PP4', false),
('tarmizie', 'tarmizie@example.com', 'MUHAMMAD TARMIZIE BIN MINHAD', 'PP6', true),
('khairil', 'khairil@example.com', 'KHAIRIL AMRI BIN AMIR', 'PP6', false),
('afis', 'afis@example.com', 'MOHD AFIS HAIZAN BIN KAMAL', 'PP6', false),
('nashriq', 'nashriq@example.com', 'MUHAMMAD NASHRIQ BIN AZIZ', 'PP6', false),
('fatin', 'fatin@example.com', 'FATIN NABILAH BINTI MOHD SIDEK', 'PP6', false),
('izzuddin', 'izzuddin@example.com', 'MUHAMMAD IZZUDDIN BIN MAZLAN', 'PP6', false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shift_exchanges_status ON shift_exchanges(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_staff_ordering_month ON staff_ordering(month_year);

-- Function to auto-generate roster
CREATE OR REPLACE FUNCTION generate_roster(
  start_date date,
  end_date date,
  pattern_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date date := start_date;
  user_record record;
  pattern_array text[];
  pattern_length integer;
  day_index integer := 0;
  user_index integer := 0;
BEGIN
  -- Get pattern
  IF pattern_id IS NULL THEN
    SELECT pattern INTO pattern_array FROM roster_patterns WHERE is_default = true LIMIT 1;
  ELSE
    SELECT pattern INTO pattern_array FROM roster_patterns WHERE id = pattern_id;
  END IF;
  
  pattern_length := array_length(pattern_array, 1);
  
  -- Clear existing shifts in date range
  DELETE FROM shifts WHERE date BETWEEN start_date AND end_date;
  
  -- Generate shifts
  WHILE current_date <= end_date LOOP
    user_index := 0;
    
    FOR user_record IN 
      SELECT u.id, u.username 
      FROM users u 
      WHERE u.is_active = true 
      ORDER BY u.username
    LOOP
      INSERT INTO shifts (user_id, date, shift_code)
      VALUES (
        user_record.id,
        current_date,
        pattern_array[((user_index * 3 + day_index) % pattern_length) + 1]
      );
      
      user_index := user_index + 1;
    END LOOP;
    
    current_date := current_date + 1;
    day_index := day_index + 1;
  END LOOP;
END;
$$;