#!/bin/bash
# GuardTrack automated Supabase setup

MGMT_TOKEN="sbp_fe4d1b50f55c945c52bdf4f3d14eced016072dad"
PROJECT_REF="nwdvdmsjmemnbxyimtwl"
SUPABASE_URL="https://nwdvdmsjmemnbxyimtwl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZHZkbXNqbWVtbmJ4eWltdHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwNjU2MiwiZXhwIjoyMDkxNjgyNTYyfQ.37I_jEcWP2ZcpGXJPNhq0KvdN513eDCLncS3jgLhuWg"
MGMT_API="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

echo "=== Step 1: Creating tables ==="
# Run schema in parts to avoid escaping issues

# Create profiles table
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, phone VARCHAR(15), role VARCHAR(10) NOT NULL DEFAULT '\''guard'\'' CHECK (role IN ('\''guard'\'', '\''admin'\'')), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW())"}'
echo ""

# Create attendance table
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS attendance (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), guard_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(), check_out TIMESTAMPTZ, check_in_lat DECIMAL(10,7), check_in_lng DECIMAL(10,7), check_out_lat DECIMAL(10,7), check_out_lng DECIMAL(10,7), total_hours DECIMAL(5,2), notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())"}'
echo ""

echo "=== Step 2: Creating indexes ==="
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_attendance_guard ON attendance(guard_id); CREATE INDEX IF NOT EXISTS idx_attendance_checkin ON attendance(check_in); CREATE INDEX IF NOT EXISTS idx_attendance_guard_checkin ON attendance(guard_id, check_in DESC)"}'
echo ""

echo "=== Step 3: Enabling RLS ==="
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE attendance ENABLE ROW LEVEL SECURITY"}'
echo ""

echo "=== Step 4: Creating RLS policies ==="
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"users_view_own_profile\" ON profiles FOR SELECT USING (auth.uid() = id)"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"admins_view_all_profiles\" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = '\''admin'\''))"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"users_update_own_profile\" ON profiles FOR UPDATE USING (auth.uid() = id)"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"guards_view_own_attendance\" ON attendance FOR SELECT USING (guard_id = auth.uid())"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"admins_view_all_attendance\" ON attendance FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = '\''admin'\''))"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"guards_insert_own_attendance\" ON attendance FOR INSERT WITH CHECK (guard_id = auth.uid())"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE POLICY \"guards_update_own_attendance\" ON attendance FOR UPDATE USING (guard_id = auth.uid())"}'
echo ""

echo "=== Step 5: Enable Realtime ==="
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER PUBLICATION supabase_realtime ADD TABLE attendance"}'
echo ""

echo "=== Step 6: Create trigger function ==="
curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, name, email, role) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'\''name'\'', split_part(NEW.email, '\''@'\'', 1)), NEW.email, COALESCE(NEW.raw_user_meta_data->>'\''role'\'', '\''guard'\'')); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER"}'
echo ""

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()"}'
echo ""

echo "=== Step 7: Creating users via Auth Admin API ==="

create_user() {
  local email=$1
  local password=$2
  local name=$3
  local role=$4
  local phone=$5

  result=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$email\", \"password\": \"$password\", \"email_confirm\": true, \"user_metadata\": {\"name\": \"$name\", \"role\": \"$role\"}}")

  user_id=$(echo "$result" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');try{console.log(JSON.parse(d).id)}catch{console.log('ERROR: '+d)}")
  echo "  Created $name ($email) -> $user_id"

  # Update phone if provided
  if [ -n "$phone" ]; then
    curl -s -X POST "$MGMT_API" \
      -H "Authorization: Bearer $MGMT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"UPDATE profiles SET phone = '$phone' WHERE id = '$user_id'\"}" > /dev/null
  fi

  echo "$user_id"
}

# Admin
ADMIN_ID=$(create_user "admin@guardtrack.com" "admin123" "Admin" "admin" "")

# Guards
G1=$(create_user "rajesh@demo.com" "guard123" "Rajesh Kumar" "guard" "9876543210")
G2=$(create_user "amit@demo.com" "guard123" "Amit Singh" "guard" "9876543211")
G3=$(create_user "priya@demo.com" "guard123" "Priya Sharma" "guard" "9876543212")
G4=$(create_user "suresh@demo.com" "guard123" "Suresh Reddy" "guard" "9876543213")
G5=$(create_user "mohan@demo.com" "guard123" "Mohan Patel" "guard" "9876543214")
G6=$(create_user "deepa@demo.com" "guard123" "Deepa Nair" "guard" "9876543215")
G7=$(create_user "vikram@demo.com" "guard123" "Vikram Joshi" "guard" "9876543216")
G8=$(create_user "anita@demo.com" "guard123" "Anita Gupta" "guard" "9876543217")
G9=$(create_user "ravi@demo.com" "guard123" "Ravi Prasad" "guard" "9876543218")
G10=$(create_user "kavita@demo.com" "guard123" "Kavita Devi" "guard" "9876543219")
G11=$(create_user "manoj@demo.com" "guard123" "Manoj Tiwari" "guard" "9876543220")
G12=$(create_user "sunita@demo.com" "guard123" "Sunita Rao" "guard" "9876543221")

echo ""
echo "=== Step 8: Seeding attendance data ==="

run_sql() {
  curl -s -X POST "$MGMT_API" \
    -H "Authorization: Bearer $MGMT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$1\"}" > /dev/null
}

# Today - 8 guards currently active (no check_out)
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '3 hours', 12.9716, 77.5946 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '4 hours', 12.9352, 77.6245 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '2 hours', 12.9698, 77.7500 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '5 hours', 13.0358, 77.5970 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '1 hour', 12.8438, 77.6630 FROM profiles WHERE email='deepa@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '6 hours', 13.1986, 77.7066 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '3 hours', 12.9141, 77.6411 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_in_lat, check_in_lng) SELECT id, NOW() - INTERVAL '2 hours', 12.9784, 77.5712 FROM profiles WHERE email='kavita@demo.com'"
echo "  Today's active check-ins done"

# Yesterday - all 12 guards completed shifts
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9 hours', NOW()-INTERVAL '1 day 30 minutes', 12.9716,77.5946,12.9720,77.5950, 8.50 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9.5 hours', NOW()-INTERVAL '1 day 1 hour', 12.9352,77.6245,12.9355,77.6248, 8.50 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 8 hours', NOW()-INTERVAL '1 day 0 hours', 12.9698,77.7500,12.9700,77.7503, 8.00 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9 hours', NOW()-INTERVAL '1 day 15 minutes', 13.0827,77.5877,13.0830,77.5880, 8.75 FROM profiles WHERE email='suresh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 10 hours', NOW()-INTERVAL '1 day 1 hour', 13.0358,77.5970,13.0360,77.5973, 9.00 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 8.5 hours', NOW()-INTERVAL '1 day 30 minutes', 12.8438,77.6630,12.8440,77.6633, 8.00 FROM profiles WHERE email='deepa@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9 hours', NOW()-INTERVAL '1 day 0 hours', 13.1986,77.7066,13.1988,77.7069, 9.00 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 8 hours', NOW()-INTERVAL '1 day 0 hours', 12.9500,77.5800,12.9503,77.5803, 8.00 FROM profiles WHERE email='anita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9.25 hours', NOW()-INTERVAL '1 day 45 minutes', 12.9141,77.6411,12.9144,77.6414, 8.50 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 8 hours', NOW()-INTERVAL '1 day 0 hours', 12.9784,77.5712,12.9787,77.5715, 8.00 FROM profiles WHERE email='kavita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 9 hours', NOW()-INTERVAL '1 day 30 minutes', 12.9600,77.6000,12.9603,77.6003, 8.50 FROM profiles WHERE email='manoj@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) SELECT id, NOW()-INTERVAL '1 day 8.5 hours', NOW()-INTERVAL '1 day 0 hours', 12.9900,77.5500,12.9903,77.5503, 8.50 FROM profiles WHERE email='sunita@demo.com'"
echo "  Yesterday's shifts done"

# 2 days ago
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 30 minutes', 12.9716,77.5946, 8.50 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 8.5 hours', NOW()-INTERVAL '2 days 0 hours', 12.9352,77.6245, 8.50 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 1 hour', 12.9698,77.7500, 8.00 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 10 hours', NOW()-INTERVAL '2 days 0 hours', 13.0827,77.5877, 10.00 FROM profiles WHERE email='suresh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 45 minutes', 13.0358,77.5970, 8.25 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9.5 hours', NOW()-INTERVAL '2 days 30 minutes', 13.1986,77.7066, 9.00 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 30 minutes', 12.9500,77.5800, 8.50 FROM profiles WHERE email='anita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 8 hours', NOW()-INTERVAL '2 days 0 hours', 12.9141,77.6411, 8.00 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 0 hours', 12.9784,77.5712, 9.00 FROM profiles WHERE email='kavita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 8.5 hours', NOW()-INTERVAL '2 days 30 minutes', 12.9600,77.6000, 8.00 FROM profiles WHERE email='manoj@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '2 days 9 hours', NOW()-INTERVAL '2 days 0 hours', 12.9900,77.5500, 9.00 FROM profiles WHERE email='sunita@demo.com'"
echo "  2 days ago done"

# 3 days ago
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 9.5 hours', NOW()-INTERVAL '3 days 0 hours', 12.9716,77.5946, 9.50 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 9 hours', NOW()-INTERVAL '3 days 30 minutes', 12.9352,77.6245, 8.50 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 8 hours', NOW()-INTERVAL '3 days 0 hours', 12.9698,77.7500, 8.00 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 9 hours', NOW()-INTERVAL '3 days 30 minutes', 13.0358,77.5970, 8.50 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 8 hours', NOW()-INTERVAL '3 days 0 hours', 12.8438,77.6630, 8.00 FROM profiles WHERE email='deepa@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 10 hours', NOW()-INTERVAL '3 days 0 hours', 13.1986,77.7066, 10.00 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 9 hours', NOW()-INTERVAL '3 days 30 minutes', 12.9141,77.6411, 8.50 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '3 days 8.5 hours', NOW()-INTERVAL '3 days 30 minutes', 12.9784,77.5712, 8.00 FROM profiles WHERE email='kavita@demo.com'"
echo "  3 days ago done"

# 4 days ago
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 9 hours', NOW()-INTERVAL '4 days 0 hours', 12.9716,77.5946, 9.00 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 8 hours', NOW()-INTERVAL '4 days 0 hours', 12.9352,77.6245, 8.00 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 9 hours', NOW()-INTERVAL '4 days 30 minutes', 13.0827,77.5877, 8.50 FROM profiles WHERE email='suresh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 9.5 hours', NOW()-INTERVAL '4 days 30 minutes', 13.0358,77.5970, 9.00 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 9 hours', NOW()-INTERVAL '4 days 30 minutes', 12.8438,77.6630, 8.50 FROM profiles WHERE email='deepa@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 8 hours', NOW()-INTERVAL '4 days 0 hours', 13.1986,77.7066, 8.00 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 8.5 hours', NOW()-INTERVAL '4 days 0 hours', 12.9500,77.5800, 8.50 FROM profiles WHERE email='anita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 9 hours', NOW()-INTERVAL '4 days 30 minutes', 12.9141,77.6411, 8.50 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '4 days 8 hours', NOW()-INTERVAL '4 days 0 hours', 12.9900,77.5500, 8.00 FROM profiles WHERE email='sunita@demo.com'"
echo "  4 days ago done"

# 5 days ago
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9 hours', NOW()-INTERVAL '5 days 30 minutes', 12.9716,77.5946, 8.50 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9 hours', NOW()-INTERVAL '5 days 0 hours', 12.9352,77.6245, 9.00 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 8.5 hours', NOW()-INTERVAL '5 days 30 minutes', 12.9698,77.7500, 8.00 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 8 hours', NOW()-INTERVAL '5 days 0 hours', 13.0827,77.5877, 8.00 FROM profiles WHERE email='suresh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9 hours', NOW()-INTERVAL '5 days 30 minutes', 13.0358,77.5970, 8.50 FROM profiles WHERE email='mohan@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9.5 hours', NOW()-INTERVAL '5 days 0 hours', 13.1986,77.7066, 9.50 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9 hours', NOW()-INTERVAL '5 days 0 hours', 12.9500,77.5800, 9.00 FROM profiles WHERE email='anita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 8 hours', NOW()-INTERVAL '5 days 0 hours', 12.9784,77.5712, 8.00 FROM profiles WHERE email='kavita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '5 days 9 hours', NOW()-INTERVAL '5 days 30 minutes', 12.9600,77.6000, 8.50 FROM profiles WHERE email='manoj@demo.com'"
echo "  5 days ago done"

# 6 days ago
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 10 hours', NOW()-INTERVAL '6 days 0 hours', 12.9716,77.5946, 10.00 FROM profiles WHERE email='rajesh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 8 hours', NOW()-INTERVAL '6 days 0 hours', 12.9352,77.6245, 8.00 FROM profiles WHERE email='amit@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9 hours', NOW()-INTERVAL '6 days 30 minutes', 12.9698,77.7500, 8.50 FROM profiles WHERE email='priya@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9 hours', NOW()-INTERVAL '6 days 0 hours', 13.0827,77.5877, 9.00 FROM profiles WHERE email='suresh@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 8.5 hours', NOW()-INTERVAL '6 days 30 minutes', 12.8438,77.6630, 8.00 FROM profiles WHERE email='deepa@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9 hours', NOW()-INTERVAL '6 days 30 minutes', 13.1986,77.7066, 8.50 FROM profiles WHERE email='vikram@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9 hours', NOW()-INTERVAL '6 days 0 hours', 12.9141,77.6411, 9.00 FROM profiles WHERE email='ravi@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9 hours', NOW()-INTERVAL '6 days 30 minutes', 12.9784,77.5712, 8.50 FROM profiles WHERE email='kavita@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 8 hours', NOW()-INTERVAL '6 days 0 hours', 12.9600,77.6000, 8.00 FROM profiles WHERE email='manoj@demo.com'"
run_sql "INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) SELECT id, NOW()-INTERVAL '6 days 9.5 hours', NOW()-INTERVAL '6 days 0 hours', 12.9900,77.5500, 9.50 FROM profiles WHERE email='sunita@demo.com'"
echo "  6 days ago done"

echo ""
echo "=== SETUP COMPLETE ==="
echo "Verify: SELECT count(*) FROM profiles => 13 (1 admin + 12 guards)"
echo "Verify: SELECT count(*) FROM attendance => ~70 records"

curl -s -X POST "$MGMT_API" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT (SELECT count(*) FROM profiles) as profiles_count, (SELECT count(*) FROM attendance) as attendance_count"}'
echo ""
echo "Done! Run: npm run dev"
