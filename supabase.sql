
-- =====================================================
-- VTMS Roster - Full Supabase SQL (Tables, RLS, Demo, Functions, Trigger)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       text UNIQUE NOT NULL,
  email          text UNIQUE,
  full_name      text NOT NULL,
  grade          text NOT NULL CHECK (grade IN ('PP4','PP6')),
  phone          text,
  is_admin       boolean DEFAULT false,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  description text,
  pp4_user_id uuid REFERENCES public.users(id),
  pp6_user_id uuid REFERENCES public.users(id) NOT NULL,
  pp6_user_2_id uuid REFERENCES public.users(id),
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES public.users(id) NOT NULL,
  date       date NOT NULL,
  shift_code text NOT NULL CHECK (shift_code IN ('N','M','E','O','MOT','NOT','AL','CTR','CG','EL','TR','MT','MC')),
  team_id    uuid REFERENCES public.teams(id),
  notes      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.shift_exchanges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id      uuid REFERENCES public.users(id) NOT NULL,
  target_user_id    uuid REFERENCES public.users(id) NOT NULL,
  original_shift_id uuid REFERENCES public.shifts(id) NOT NULL,
  target_shift_id   uuid REFERENCES public.shifts(id) NOT NULL,
  status            text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason            text,
  admin_notes       text,
  approved_by       uuid REFERENCES public.users(id),
  approved_at       timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        text NOT NULL,
  description  text,
  date         date NOT NULL,
  type         text DEFAULT 'other' CHECK (type IN ('holiday','training','meeting','other')),
  is_recurring boolean DEFAULT false,
  created_by   uuid REFERENCES public.users(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_ordering (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year     text NOT NULL,
  user_id        uuid REFERENCES public.users(id) NOT NULL,
  order_position integer NOT NULL,
  created_by     uuid REFERENCES public.users(id) NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(month_year, user_id),
  UNIQUE(month_year, order_position)
);

CREATE TABLE IF NOT EXISTS public.roster_patterns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  pattern    jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ordering  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_patterns ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exist to be idempotent)
DROP POLICY IF EXISTS "Users can read users (anon)" ON public.users;
DROP POLICY IF EXISTS "Users can read users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

CREATE POLICY "Users can read users (anon)"
ON public.users FOR SELECT TO anon
USING (true);

CREATE POLICY "Users can read users"
ON public.users FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage users"
ON public.users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

DROP POLICY IF EXISTS "Users can read all shifts" ON public.shifts;
DROP POLICY IF EXISTS "Admins can manage shifts"  ON public.shifts;

CREATE POLICY "Users can read all shifts"
ON public.shifts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage shifts"
ON public.shifts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true));

DROP POLICY IF EXISTS "Users can read relevant exchanges"   ON public.shift_exchanges;
DROP POLICY IF EXISTS "Users can create exchange requests"  ON public.shift_exchanges;
DROP POLICY IF EXISTS "Users can update own requests"       ON public.shift_exchanges;

CREATE POLICY "Users can read relevant exchanges"
ON public.shift_exchanges FOR SELECT TO authenticated
USING (
  requester_id::text = auth.uid()::text OR
  target_user_id::text = auth.uid()::text OR
  EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true)
);

CREATE POLICY "Users can create exchange requests"
ON public.shift_exchanges FOR INSERT TO authenticated
WITH CHECK (requester_id::text = auth.uid()::text);

CREATE POLICY "Users can update own requests"
ON public.shift_exchanges FOR UPDATE TO authenticated
USING (
  requester_id::text = auth.uid()::text OR
  target_user_id::text = auth.uid()::text OR
  EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true)
);

DROP POLICY IF EXISTS "Users can read events"   ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Users can read events"
ON public.events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true));

DROP POLICY IF EXISTS "Users can read staff ordering"  ON public.staff_ordering;
DROP POLICY IF EXISTS "Admins can manage staff ordering" ON public.staff_ordering;

CREATE POLICY "Users can read staff ordering"
ON public.staff_ordering FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage staff ordering"
ON public.staff_ordering FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true));

DROP POLICY IF EXISTS "Users can read patterns"  ON public.roster_patterns;
DROP POLICY IF EXISTS "Admins can manage patterns" ON public.roster_patterns;

CREATE POLICY "Users can read patterns"
ON public.roster_patterns FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage patterns"
ON public.roster_patterns FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND is_admin = true));

-- Demo data
INSERT INTO public.roster_patterns (name, pattern, is_default)
VALUES ('Default 15-day Pattern', '["N","N","N","O","O","E","E","E","O","O","M","M","M","O","O"]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.users (username, email, full_name, grade, is_admin)
VALUES
('raja',   'raja@example.com',    'RAJA AHMAD ZUHAIRI BIN RAJA OTHMAN', 'PP4', true),
('hurul',  'hurul@example.com',   'HURUL AZIELLA BINTI HARIS',          'PP4', false),
('faeez',  'faeez@example.com',   'KHAIRUL FAEEZ BIN MD.IDROS',         'PP4', false),
('farid',  'farid@example.com',   'MOHAMAD FARID BIN ZULKIFLI',         'PP4', false),
('tarmizie','tarmizie@example.com','MUHAMMAD TARMIZIE BIN MINHAD',      'PP6', true),
('khairil','khairil@example.com', 'KHAIRIL AMRI BIN AMIR',              'PP6', false),
('afis',   'afis@example.com',    'MOHD AFIS HAIZAN BIN KAMAL',         'PP6', false),
('nashriq','nashriq@example.com', 'MUHAMMAD NASHRIQ BIN AZIZ',          'PP6', false),
('fatin',  'fatin@example.com',   'FATIN NABILAH BINTI MOHD SIDEK',     'PP6', false),
('izzuddin','izzuddin@example.com','MUHAMMAD IZZUDDIN BIN MAZLAN',      'PP6', false)
ON CONFLICT (username) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_user_date        ON public.shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_date             ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shift_exchanges_status  ON public.shift_exchanges(status);
CREATE INDEX IF NOT EXISTS idx_events_date             ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_staff_ordering_month    ON public.staff_ordering(month_year);

-- Functions
CREATE OR REPLACE FUNCTION public.generate_roster(
  p_start_date date,
  p_end_date date,
  p_pattern_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date date := p_start_date;
  v_user RECORD;
  v_pattern text[];
  v_pattern_len integer;
  v_day_idx integer := 0;
  v_user_idx integer := 0;
BEGIN
  IF p_pattern_id IS NULL THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(pattern))
      INTO v_pattern
    FROM public.roster_patterns
    WHERE is_default = true
    LIMIT 1;
  ELSE
    SELECT ARRAY(SELECT jsonb_array_elements_text(pattern))
      INTO v_pattern
    FROM public.roster_patterns
    WHERE id = p_pattern_id;
  END IF;

  IF v_pattern IS NULL OR array_length(v_pattern,1) IS NULL THEN
    RAISE EXCEPTION 'No roster pattern found';
  END IF;

  v_pattern_len := array_length(v_pattern, 1);

  DELETE FROM public.shifts WHERE date BETWEEN p_start_date AND p_end_date;

  WHILE v_current_date <= p_end_date LOOP
    v_user_idx := 0;
    FOR v_user IN
      SELECT u.id, u.username
      FROM public.users u
      WHERE u.is_active = true
      ORDER BY u.username
    LOOP
      INSERT INTO public.shifts (user_id, date, shift_code)
      VALUES (
        v_user.id,
        v_current_date,
        v_pattern[((v_user_idx * 3 + v_day_idx) % v_pattern_len) + 1]
      );
      v_user_idx := v_user_idx + 1;
    END LOOP;
    v_current_date := v_current_date + 1;
    v_day_idx := v_day_idx + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_shift_exchange()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.shifts SET user_id = NEW.target_user_id WHERE id = NEW.original_shift_id;
    UPDATE public.shifts SET user_id = NEW.requester_id WHERE id = NEW.target_shift_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_shift_exchange ON public.shift_exchanges;
CREATE TRIGGER trg_apply_shift_exchange
AFTER UPDATE ON public.shift_exchanges
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION public.apply_shift_exchange();

GRANT EXECUTE ON FUNCTION public.apply_shift_exchange() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_roster(date, date, uuid) TO authenticated;
