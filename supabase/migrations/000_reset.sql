-- ============================================================
-- BookMyThing – RESET SCRIPT
-- Run this FIRST in Supabase SQL Editor to wipe everything clean
-- Then run 001_init_schema.sql followed by 002_rls_policies.sql
-- ============================================================

-- Drop the auth trigger first (it lives on auth.users, not our tables)
drop trigger if exists on_auth_user_created on auth.users;

-- Drop all tables (CASCADE automatically removes all triggers,
-- indexes, foreign keys, and RLS policies on these tables)
drop table if exists notifications       cascade;
drop table if exists booking_logs        cascade;
drop table if exists bookings            cascade;
drop table if exists staff_leaves        cascade;
drop table if exists working_hours       cascade;
drop table if exists staff_services      cascade;
drop table if exists services            cascade;
drop table if exists profiles            cascade;
drop table if exists businesses          cascade;

-- Drop functions
drop function if exists handle_new_user()              cascade;
drop function if exists set_updated_at()               cascade;
drop function if exists log_booking_status_change()    cascade;
drop function if exists get_my_role()                  cascade;
drop function if exists get_my_business_id()           cascade;
drop function if exists is_super_admin()               cascade;

-- Drop custom enum types
drop type if exists user_role                      cascade;
drop type if exists booking_status                 cascade;
drop type if exists payment_status                 cascade;
drop type if exists notification_type              cascade;
drop type if exists notification_channel           cascade;
drop type if exists notification_delivery_status   cascade;
