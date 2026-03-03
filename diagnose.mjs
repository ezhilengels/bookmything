import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jpiwlvoyuksrhqhzafhc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaXdsdm95dWtzcmhxaHphZmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTYxOTMsImV4cCI6MjA4ODAzMjE5M30.dwvLKpqteXqxnfbzOkAsOzAsRTcaJDwdZUt-iUXTUWs';
const SERVICE_KEY = 'sb_secret_gklKaE33_EHLHM36kdTCHA__cvCzdfw';

const anon = createClient(SUPABASE_URL, ANON_KEY);
const service = createClient(SUPABASE_URL, SERVICE_KEY);

const SLUG = 'ezhil-clicnic';
const SERVICE_ID = 'eb47e952-21eb-4396-96c5-77b25783c163';
const DATE = '2026-03-04'; // Wednesday = day_of_week 3

console.log('=== 1. Fetch business by slug (anon) ===');
const { data: biz, error: bizErr } = await anon.from('businesses').select('id, name, timezone').eq('slug', SLUG).single();
console.log('business:', biz, 'error:', bizErr);

if (!biz) { console.log('STOP: no business found'); process.exit(1); }

console.log('\n=== 2. Fetch service (anon) ===');
const { data: svc, error: svcErr } = await anon.from('services').select('id, name, duration_minutes').eq('id', SERVICE_ID).single();
console.log('service:', svc, 'error:', svcErr);

console.log('\n=== 3. Fetch staff with working_hours for Wednesday (anon) ===');
const { data: staffAnon, error: staffAnonErr } = await anon
  .from('profiles')
  .select('id, name, working_hours!inner(*)')
  .eq('business_id', biz.id)
  .eq('role', 'staff')
  .eq('working_hours.day_of_week', 3)
  .eq('working_hours.is_active', true);
console.log('staff (anon):', JSON.stringify(staffAnon, null, 2), 'error:', staffAnonErr);

console.log('\n=== 4. Same query with SERVICE client ===');
const { data: staffSvc, error: staffSvcErr } = await service
  .from('profiles')
  .select('id, name, working_hours!inner(*)')
  .eq('business_id', biz.id)
  .eq('role', 'staff')
  .eq('working_hours.day_of_week', 3)
  .eq('working_hours.is_active', true);
console.log('staff (service):', JSON.stringify(staffSvc, null, 2), 'error:', staffSvcErr);

console.log('\n=== 5. All staff for this business (no working_hours filter) ===');
const { data: allStaff, error: allStaffErr } = await service
  .from('profiles')
  .select('id, name, role')
  .eq('business_id', biz.id)
  .eq('role', 'staff');
console.log('all staff:', allStaff, 'error:', allStaffErr);

console.log('\n=== 6. All working_hours for business staff ===');
if (allStaff && allStaff.length > 0) {
  const staffIds = allStaff.map(s => s.id);
  const { data: wh, error: whErr } = await service
    .from('working_hours')
    .select('*')
    .in('staff_id', staffIds);
  console.log('working_hours:', JSON.stringify(wh, null, 2), 'error:', whErr);
} else {
  console.log('No staff found, skipping working_hours check');
}
