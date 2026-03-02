-- ============================================================
-- BookMyThing – Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table businesses     enable row level security;
alter table profiles       enable row level security;
alter table services       enable row level security;
alter table staff_services enable row level security;
alter table working_hours  enable row level security;
alter table staff_leaves   enable row level security;
alter table bookings       enable row level security;
alter table booking_logs   enable row level security;
alter table notifications  enable row level security;

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────

-- Get current user's role
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Get current user's business_id
create or replace function get_my_business_id()
returns uuid as $$
  select business_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Check if current user is super admin
create or replace function is_super_admin()
returns boolean as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$ language sql security definer stable;

-- ─────────────────────────────────────────
-- BUSINESSES POLICIES
-- ─────────────────────────────────────────
-- Anyone can view active businesses (for public booking pages)
create policy "Public can view active businesses"
  on businesses for select
  using (is_active = true);

-- Business admin can view and update their own business
create policy "Business admin can manage their business"
  on businesses for all
  using (id = get_my_business_id() and get_my_role() = 'business_admin')
  with check (id = get_my_business_id() and get_my_role() = 'business_admin');

-- Super admin has full access
create policy "Super admin full access to businesses"
  on businesses for all
  using (is_super_admin());

-- ─────────────────────────────────────────
-- PROFILES POLICIES
-- ─────────────────────────────────────────
-- Users can view and update their own profile
create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Business admin can view profiles within their business (staff + customers who booked)
create policy "Business admin can view business profiles"
  on profiles for select
  using (
    get_my_role() = 'business_admin'
    and business_id = get_my_business_id()
  );

-- Super admin has full access
create policy "Super admin full access to profiles"
  on profiles for all
  using (is_super_admin());

-- ─────────────────────────────────────────
-- SERVICES POLICIES
-- ─────────────────────────────────────────
-- Anyone can view active services (for public booking flow)
create policy "Public can view active services"
  on services for select
  using (is_active = true);

-- Business admin can manage their services
create policy "Business admin can manage services"
  on services for all
  using (business_id = get_my_business_id() and get_my_role() = 'business_admin')
  with check (business_id = get_my_business_id() and get_my_role() = 'business_admin');

create policy "Super admin full access to services"
  on services for all
  using (is_super_admin());

-- ─────────────────────────────────────────
-- STAFF_SERVICES POLICIES
-- ─────────────────────────────────────────
create policy "Public can view staff services"
  on staff_services for select
  using (true);

create policy "Business admin can manage staff services"
  on staff_services for all
  using (
    get_my_role() = 'business_admin'
    and exists (
      select 1 from profiles where id = staff_id and business_id = get_my_business_id()
    )
  );

-- ─────────────────────────────────────────
-- WORKING HOURS POLICIES
-- ─────────────────────────────────────────
-- Anyone can view working hours (for slot generation)
create policy "Public can view working hours"
  on working_hours for select
  using (true);

-- Staff can manage their own working hours
create policy "Staff can manage own working hours"
  on working_hours for all
  using (staff_id = auth.uid() and get_my_role() = 'staff')
  with check (staff_id = auth.uid() and get_my_role() = 'staff');

-- Business admin can manage all staff working hours in their business
create policy "Business admin can manage working hours"
  on working_hours for all
  using (
    get_my_role() = 'business_admin'
    and exists (
      select 1 from profiles where id = staff_id and business_id = get_my_business_id()
    )
  );

-- ─────────────────────────────────────────
-- STAFF LEAVES POLICIES
-- ─────────────────────────────────────────
create policy "Public can view staff leaves"
  on staff_leaves for select
  using (true);

create policy "Staff can manage own leaves"
  on staff_leaves for all
  using (staff_id = auth.uid() and get_my_role() = 'staff')
  with check (staff_id = auth.uid() and get_my_role() = 'staff');

create policy "Business admin can manage staff leaves"
  on staff_leaves for all
  using (
    get_my_role() = 'business_admin'
    and exists (
      select 1 from profiles where id = staff_id and business_id = get_my_business_id()
    )
  );

-- ─────────────────────────────────────────
-- BOOKINGS POLICIES
-- ─────────────────────────────────────────
-- Customers can view and manage their own bookings
create policy "Customers can view own bookings"
  on bookings for select
  using (customer_id = auth.uid());

create policy "Customers can create bookings"
  on bookings for insert
  with check (customer_id = auth.uid() and get_my_role() = 'customer');

create policy "Customers can update own bookings (cancel/reschedule)"
  on bookings for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Staff can view bookings assigned to them
create policy "Staff can view assigned bookings"
  on bookings for select
  using (staff_id = auth.uid() and get_my_role() = 'staff');

create policy "Staff can update assigned booking status"
  on bookings for update
  using (staff_id = auth.uid() and get_my_role() = 'staff');

-- Business admin can manage all bookings in their business
create policy "Business admin can manage business bookings"
  on bookings for all
  using (business_id = get_my_business_id() and get_my_role() = 'business_admin')
  with check (business_id = get_my_business_id() and get_my_role() = 'business_admin');

create policy "Super admin full access to bookings"
  on bookings for all
  using (is_super_admin());

-- ─────────────────────────────────────────
-- BOOKING LOGS POLICIES
-- ─────────────────────────────────────────
create policy "Business admin can view booking logs"
  on booking_logs for select
  using (
    get_my_role() = 'business_admin'
    and exists (
      select 1 from bookings b
      where b.id = booking_id and b.business_id = get_my_business_id()
    )
  );

create policy "Customers can view own booking logs"
  on booking_logs for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

create policy "Super admin full access to booking logs"
  on booking_logs for all
  using (is_super_admin());

-- ─────────────────────────────────────────
-- NOTIFICATIONS POLICIES
-- ─────────────────────────────────────────
-- Only server-side (service role) should manage notifications
-- Admins can view for auditing
create policy "Business admin can view notifications"
  on notifications for select
  using (
    get_my_role() = 'business_admin'
    and exists (
      select 1 from bookings b
      where b.id = booking_id and b.business_id = get_my_business_id()
    )
  );

create policy "Super admin full access to notifications"
  on notifications for all
  using (is_super_admin());
