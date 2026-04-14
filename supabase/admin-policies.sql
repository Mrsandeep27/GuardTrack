-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- These policies allow admins to manage guards (update + delete)

-- Admin can update any profile (for deactivation, phone updates)
CREATE POLICY "admins_update_profiles"
  ON profiles FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete profiles
CREATE POLICY "admins_delete_profiles"
  ON profiles FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete attendance records (for guard removal)
CREATE POLICY "admins_delete_attendance"
  ON attendance FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
