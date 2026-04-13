-- GuardTrack Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table (guards + admins)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  phone      VARCHAR(15),
  role       VARCHAR(10) NOT NULL DEFAULT 'guard' CHECK (role IN ('guard', 'admin')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table (check-in / check-out records)
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out     TIMESTAMPTZ,
  check_in_lat  DECIMAL(10,7),
  check_in_lng  DECIMAL(10,7),
  check_out_lat DECIMAL(10,7),
  check_out_lng DECIMAL(10,7),
  total_hours   DECIMAL(5,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attendance_guard ON attendance(guard_id);
CREATE INDEX idx_attendance_checkin ON attendance(check_in);
CREATE INDEX idx_attendance_guard_checkin ON attendance(guard_id, check_in DESC);
CREATE UNIQUE INDEX idx_one_active_session ON attendance(guard_id) WHERE check_out IS NULL;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Profiles policies (no self-referencing to avoid infinite recursion)
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Attendance policies
CREATE POLICY "attendance_select"
  ON attendance FOR SELECT
  USING (
    guard_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "attendance_insert"
  ON attendance FOR INSERT
  WITH CHECK (guard_id = auth.uid());

CREATE POLICY "attendance_update"
  ON attendance FOR UPDATE
  USING (guard_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guard')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
