-- GuardTrack Seed Data
-- Run AFTER creating users via Supabase Auth (or use the trigger)
--
-- Demo Credentials:
--   Admin:  admin@guardtrack.com / admin123
--   Guard:  rajesh@demo.com / guard123 (and all guards below)
--
-- STEP 1: Create users via Supabase Auth dashboard or API
-- STEP 2: The trigger auto-creates profiles
-- STEP 3: Update profiles with phone numbers
-- STEP 4: Insert attendance data
--
-- Alternatively, if you want to manually seed without auth users,
-- insert directly into profiles (use UUIDs matching auth.users):

-- Update guard profiles with phone numbers (run after users are created via Auth)
UPDATE profiles SET phone = '9876543210' WHERE email = 'rajesh@demo.com';
UPDATE profiles SET phone = '9876543211' WHERE email = 'amit@demo.com';
UPDATE profiles SET phone = '9876543212' WHERE email = 'priya@demo.com';
UPDATE profiles SET phone = '9876543213' WHERE email = 'suresh@demo.com';
UPDATE profiles SET phone = '9876543214' WHERE email = 'mohan@demo.com';
UPDATE profiles SET phone = '9876543215' WHERE email = 'deepa@demo.com';
UPDATE profiles SET phone = '9876543216' WHERE email = 'vikram@demo.com';
UPDATE profiles SET phone = '9876543217' WHERE email = 'anita@demo.com';
UPDATE profiles SET phone = '9876543218' WHERE email = 'ravi@demo.com';
UPDATE profiles SET phone = '9876543219' WHERE email = 'kavita@demo.com';
UPDATE profiles SET phone = '9876543220' WHERE email = 'manoj@demo.com';
UPDATE profiles SET phone = '9876543221' WHERE email = 'sunita@demo.com';

-- Insert 7 days of attendance data
-- Bangalore area coordinates (12.9°N, 77.5°E area)

-- TODAY: 8 guards currently checked in (no check_out)
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '3 hours', NULL, 12.9716, 77.5946, NULL),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '4 hours', NULL, 12.9352, 77.6245, NULL),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '2 hours', NULL, 12.9698, 77.7500, NULL),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '5 hours', NULL, 13.0358, 77.5970, NULL),
  ((SELECT id FROM profiles WHERE email='deepa@demo.com'), NOW() - INTERVAL '1 hour', NULL, 12.8438, 77.6630, NULL),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '6 hours', NULL, 13.1986, 77.7066, NULL),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '3 hours', NULL, 12.9141, 77.6411, NULL),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '2 hours', NULL, 12.9784, 77.5712, NULL);

-- YESTERDAY: completed shifts
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0.5 hours', 12.9716, 77.5946, 12.9720, 77.5950, 8.50),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '1 day 9.5 hours', NOW() - INTERVAL '1 day 1 hour', 12.9352, 77.6245, 12.9355, 77.6248, 8.50),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 0 hours', 12.9698, 77.7500, 12.9700, 77.7503, 8.00),
  ((SELECT id FROM profiles WHERE email='suresh@demo.com'), NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0.25 hours', 13.0827, 77.5877, 13.0830, 77.5880, 8.75),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '1 day 10 hours', NOW() - INTERVAL '1 day 1 hour', 13.0358, 77.5970, 13.0360, 77.5973, 9.00),
  ((SELECT id FROM profiles WHERE email='deepa@demo.com'), NOW() - INTERVAL '1 day 8.5 hours', NOW() - INTERVAL '1 day 0.5 hours', 12.8438, 77.6630, 12.8440, 77.6633, 8.00),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0 hours', 13.1986, 77.7066, 13.1988, 77.7069, 9.00),
  ((SELECT id FROM profiles WHERE email='anita@demo.com'), NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 0 hours', 12.9500, 77.5800, 12.9503, 77.5803, 8.00),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '1 day 9.25 hours', NOW() - INTERVAL '1 day 0.75 hours', 12.9141, 77.6411, 12.9144, 77.6414, 8.50),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 0 hours', 12.9784, 77.5712, 12.9787, 77.5715, 8.00),
  ((SELECT id FROM profiles WHERE email='manoj@demo.com'), NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0.5 hours', 12.9600, 77.6000, 12.9603, 77.6003, 8.50),
  ((SELECT id FROM profiles WHERE email='sunita@demo.com'), NOW() - INTERVAL '1 day 8.5 hours', NOW() - INTERVAL '1 day 0 hours', 12.9900, 77.5500, 12.9903, 77.5503, 8.50);

-- 2 DAYS AGO
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 0.5 hours', 12.9716, 77.5946, 12.9720, 77.5950, 8.50),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '2 days 8.5 hours', NOW() - INTERVAL '2 days 0 hours', 12.9352, 77.6245, 12.9355, 77.6248, 8.50),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 1 hour', 12.9698, 77.7500, 12.9700, 77.7503, 8.00),
  ((SELECT id FROM profiles WHERE email='suresh@demo.com'), NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '2 days 0 hours', 13.0827, 77.5877, 13.0830, 77.5880, 10.00),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 0.75 hours', 13.0358, 77.5970, 13.0360, 77.5973, 8.25),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '2 days 9.5 hours', NOW() - INTERVAL '2 days 0.5 hours', 13.1986, 77.7066, 13.1988, 77.7069, 9.00),
  ((SELECT id FROM profiles WHERE email='anita@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 0.5 hours', 12.9500, 77.5800, 12.9503, 77.5803, 8.50),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 0 hours', 12.9141, 77.6411, 12.9144, 77.6414, 8.00),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 0 hours', 12.9784, 77.5712, 12.9787, 77.5715, 9.00),
  ((SELECT id FROM profiles WHERE email='manoj@demo.com'), NOW() - INTERVAL '2 days 8.5 hours', NOW() - INTERVAL '2 days 0.5 hours', 12.9600, 77.6000, 12.9603, 77.6003, 8.00),
  ((SELECT id FROM profiles WHERE email='sunita@demo.com'), NOW() - INTERVAL '2 days 9 hours', NOW() - INTERVAL '2 days 0 hours', 12.9900, 77.5500, 12.9903, 77.5503, 9.00);

-- 3 DAYS AGO
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '3 days 9.5 hours', NOW() - INTERVAL '3 days 0 hours', 12.9716, 77.5946, 12.9720, 77.5950, 9.50),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 0.5 hours', 12.9352, 77.6245, 12.9355, 77.6248, 8.50),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '3 days 8 hours', NOW() - INTERVAL '3 days 0 hours', 12.9698, 77.7500, 12.9700, 77.7503, 8.00),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 0.5 hours', 13.0358, 77.5970, 13.0360, 77.5973, 8.50),
  ((SELECT id FROM profiles WHERE email='deepa@demo.com'), NOW() - INTERVAL '3 days 8 hours', NOW() - INTERVAL '3 days 0 hours', 12.8438, 77.6630, 12.8440, 77.6633, 8.00),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '3 days 10 hours', NOW() - INTERVAL '3 days 0 hours', 13.1986, 77.7066, 13.1988, 77.7069, 10.00),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 0.5 hours', 12.9141, 77.6411, 12.9144, 77.6414, 8.50),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '3 days 8.5 hours', NOW() - INTERVAL '3 days 0.5 hours', 12.9784, 77.5712, 12.9787, 77.5715, 8.00);

-- 4 DAYS AGO
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '4 days 9 hours', NOW() - INTERVAL '4 days 0 hours', 12.9716, 77.5946, 12.9720, 77.5950, 9.00),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '4 days 8 hours', NOW() - INTERVAL '4 days 0 hours', 12.9352, 77.6245, 12.9355, 77.6248, 8.00),
  ((SELECT id FROM profiles WHERE email='suresh@demo.com'), NOW() - INTERVAL '4 days 9 hours', NOW() - INTERVAL '4 days 0.5 hours', 13.0827, 77.5877, 13.0830, 77.5880, 8.50),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '4 days 9.5 hours', NOW() - INTERVAL '4 days 0.5 hours', 13.0358, 77.5970, 13.0360, 77.5973, 9.00),
  ((SELECT id FROM profiles WHERE email='deepa@demo.com'), NOW() - INTERVAL '4 days 9 hours', NOW() - INTERVAL '4 days 0.5 hours', 12.8438, 77.6630, 12.8440, 77.6633, 8.50),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '4 days 8 hours', NOW() - INTERVAL '4 days 0 hours', 13.1986, 77.7066, 13.1988, 77.7069, 8.00),
  ((SELECT id FROM profiles WHERE email='anita@demo.com'), NOW() - INTERVAL '4 days 8.5 hours', NOW() - INTERVAL '4 days 0 hours', 12.9500, 77.5800, 12.9503, 77.5803, 8.50),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '4 days 9 hours', NOW() - INTERVAL '4 days 0.5 hours', 12.9141, 77.6411, 12.9144, 77.6414, 8.50),
  ((SELECT id FROM profiles WHERE email='sunita@demo.com'), NOW() - INTERVAL '4 days 8 hours', NOW() - INTERVAL '4 days 0 hours', 12.9900, 77.5500, 12.9903, 77.5503, 8.00);

-- 5 DAYS AGO
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 0.5 hours', 12.9716, 77.5946, 12.9720, 77.5950, 8.50),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 0 hours', 12.9352, 77.6245, 12.9355, 77.6248, 9.00),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '5 days 8.5 hours', NOW() - INTERVAL '5 days 0.5 hours', 12.9698, 77.7500, 12.9700, 77.7503, 8.00),
  ((SELECT id FROM profiles WHERE email='suresh@demo.com'), NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 0 hours', 13.0827, 77.5877, 13.0830, 77.5880, 8.00),
  ((SELECT id FROM profiles WHERE email='mohan@demo.com'), NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 0.5 hours', 13.0358, 77.5970, 13.0360, 77.5973, 8.50),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '5 days 9.5 hours', NOW() - INTERVAL '5 days 0 hours', 13.1986, 77.7066, 13.1988, 77.7069, 9.50),
  ((SELECT id FROM profiles WHERE email='anita@demo.com'), NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 0 hours', 12.9500, 77.5800, 12.9503, 77.5803, 9.00),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 0 hours', 12.9784, 77.5712, 12.9787, 77.5715, 8.00),
  ((SELECT id FROM profiles WHERE email='manoj@demo.com'), NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 0.5 hours', 12.9600, 77.6000, 12.9603, 77.6003, 8.50);

-- 6 DAYS AGO
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours) VALUES
  ((SELECT id FROM profiles WHERE email='rajesh@demo.com'), NOW() - INTERVAL '6 days 10 hours', NOW() - INTERVAL '6 days 0 hours', 12.9716, 77.5946, 12.9720, 77.5950, 10.00),
  ((SELECT id FROM profiles WHERE email='amit@demo.com'), NOW() - INTERVAL '6 days 8 hours', NOW() - INTERVAL '6 days 0 hours', 12.9352, 77.6245, 12.9355, 77.6248, 8.00),
  ((SELECT id FROM profiles WHERE email='priya@demo.com'), NOW() - INTERVAL '6 days 9 hours', NOW() - INTERVAL '6 days 0.5 hours', 12.9698, 77.7500, 12.9700, 77.7503, 8.50),
  ((SELECT id FROM profiles WHERE email='suresh@demo.com'), NOW() - INTERVAL '6 days 9 hours', NOW() - INTERVAL '6 days 0 hours', 13.0827, 77.5877, 13.0830, 77.5880, 9.00),
  ((SELECT id FROM profiles WHERE email='deepa@demo.com'), NOW() - INTERVAL '6 days 8.5 hours', NOW() - INTERVAL '6 days 0.5 hours', 12.8438, 77.6630, 12.8440, 77.6633, 8.00),
  ((SELECT id FROM profiles WHERE email='vikram@demo.com'), NOW() - INTERVAL '6 days 9 hours', NOW() - INTERVAL '6 days 0.5 hours', 13.1986, 77.7066, 13.1988, 77.7069, 8.50),
  ((SELECT id FROM profiles WHERE email='ravi@demo.com'), NOW() - INTERVAL '6 days 9 hours', NOW() - INTERVAL '6 days 0 hours', 12.9141, 77.6411, 12.9144, 77.6414, 9.00),
  ((SELECT id FROM profiles WHERE email='kavita@demo.com'), NOW() - INTERVAL '6 days 9 hours', NOW() - INTERVAL '6 days 0.5 hours', 12.9784, 77.5712, 12.9787, 77.5715, 8.50),
  ((SELECT id FROM profiles WHERE email='manoj@demo.com'), NOW() - INTERVAL '6 days 8 hours', NOW() - INTERVAL '6 days 0 hours', 12.9600, 77.6000, 12.9603, 77.6003, 8.00),
  ((SELECT id FROM profiles WHERE email='sunita@demo.com'), NOW() - INTERVAL '6 days 9.5 hours', NOW() - INTERVAL '6 days 0 hours', 12.9900, 77.5500, 12.9903, 77.5503, 9.50);
