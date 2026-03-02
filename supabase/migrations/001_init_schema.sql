-- ============================================================
-- BookMyThing – Initial Schema Migration
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- Enable useful extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
create type user_role as enum ('super_admin', 'business_admin', 'staff', 'customer');
create type booking_status as enum ('new', 'confirmed', 'completed', 'cancelled', 'no_show');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type notification_type as enum ('confirmation', 'reminder_24h', 'reminder_1h', 'cancellation', 'new_booking');
create type notification_channel as enum ('email', 'whatsapp');
create type notification_delivery_status as enum ('sent', 'failed', 'pending');

-- ─────────────────────────────────────────
-- BUSINESSES (Tenants)
-- ─────────────────────────────────────────
create table businesses (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  logo_url     text,
  description  text,
  timezone     text not null default 'Asia/Kolkata',
  contact_email text not null,
  contact_phone text,
  address      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  business_id  uuid references businesses(id) on delete set null,
  role         user_role not null default 'customer',
  name         text not null default '',
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────
create table services (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  description       text,
  duration_minutes  int not null check (duration_minutes > 0),
  price             numeric(10,2) not null check (price >= 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- STAFF ↔ SERVICES (junction)
-- ─────────────────────────────────────────
create table staff_services (
  staff_id    uuid not null references profiles(id) on delete cascade,
  service_id  uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ─────────────────────────────────────────
-- WORKING HOURS
-- ─────────────────────────────────────────
create table working_hours (
  id           uuid primary key default uuid_generate_v4(),
  staff_id     uuid not null references profiles(id) on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6), -- 0 = Sun, 6 = Sat
  start_time   time not null,
  end_time     time not null,
  break_start  time,
  break_end    time,
  is_active    boolean not null default true,
  constraint no_overlap unique (staff_id, day_of_week)
);

-- ─────────────────────────────────────────
-- STAFF LEAVES
-- ─────────────────────────────────────────
create table staff_leaves (
  id        uuid primary key default uuid_generate_v4(),
  staff_id  uuid not null references profiles(id) on delete cascade,
  date      date not null,
  reason    text,
  created_at timestamptz not null default now(),
  constraint unique_staff_leave unique (staff_id, date)
);

-- ─────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────
create table bookings (
  id                    uuid primary key default uuid_generate_v4(),
  business_id           uuid not null references businesses(id) on delete cascade,
  service_id            uuid not null references services(id),
  staff_id              uuid not null references profiles(id),
  customer_id           uuid not null references profiles(id),
  start_time            timestamptz not null,
  end_time              timestamptz not null,
  status                booking_status not null default 'new',
  notes                 text,
  payment_status        payment_status not null default 'pending',
  razorpay_order_id     text,
  razorpay_payment_id   text,
  cancelled_by          uuid references profiles(id),
  cancellation_reason   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Prevent double-booking: same staff cannot have overlapping confirmed bookings
  constraint no_overlap check (start_time < end_time)
);

-- Unique index to prevent double-booking for the same staff slot
create unique index prevent_double_booking
  on bookings (staff_id, start_time)
  where status in ('new', 'confirmed');

-- ─────────────────────────────────────────
-- BOOKING LOGS (audit trail)
-- ─────────────────────────────────────────
create table booking_logs (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  actor_id    uuid references profiles(id),
  old_status  booking_status,
  new_status  booking_status not null,
  notes       text,
  changed_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  type        notification_type not null,
  channel     notification_channel not null default 'email',
  status      notification_delivery_status not null default 'pending',
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz not null default now(),
  -- Prevent duplicate notifications for same booking + type + channel
  constraint unique_notification unique (booking_id, type, channel)
);

-- ─────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at on row changes
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_businesses_updated_at before update on businesses
  for each row execute function set_updated_at();
create trigger set_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_services_updated_at before update on services
  for each row execute function set_updated_at();
create trigger set_bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- Auto-log booking status changes
create or replace function log_booking_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into booking_logs (booking_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_booking_status_change
  after update on bookings
  for each row execute function log_booking_status_change();

-- ─────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────
create index idx_bookings_business_id on bookings(business_id);
create index idx_bookings_staff_id on bookings(staff_id);
create index idx_bookings_customer_id on bookings(customer_id);
create index idx_bookings_start_time on bookings(start_time);
create index idx_bookings_status on bookings(status);
create index idx_services_business_id on services(business_id);
create index idx_profiles_business_id on profiles(business_id);
create index idx_notifications_booking_id on notifications(booking_id);
create index idx_notifications_status on notifications(status);
