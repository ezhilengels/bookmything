-- ─────────────────────────────────────────
-- Add latitude/longitude to businesses table
-- for distance-based sorting in customer view
-- ─────────────────────────────────────────

alter table businesses
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

comment on column businesses.latitude  is 'GPS latitude for distance calculation in customer browse view';
comment on column businesses.longitude is 'GPS longitude for distance calculation in customer browse view';
