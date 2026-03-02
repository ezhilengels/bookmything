# BookMyThing — Appointment Booking SaaS

Multi-tenant appointment booking platform for clinics, salons, coaches, and service providers.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# → Fill in all values (see below)

# 3. Run Supabase migrations
# Paste contents of supabase/migrations/001_init_schema.sql into Supabase SQL editor
# Then paste supabase/migrations/002_rls_policies.sql

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, keep secret) |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (for client-side modal) |
| `RESEND_API_KEY` | Resend email API key |
| `EMAIL_FROM` | Sender email address (must be verified in Resend) |
| `CRON_SECRET` | Long random string to secure the cron endpoint |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (auth)/register/       # Registration page
│   ├── book/[slug]/           # Public booking flow (service → slot → confirm)
│   ├── dashboard/             # Business Admin dashboard
│   ├── staff/                 # Staff portal
│   ├── customer/bookings/     # Customer bookings
│   ├── admin/                 # Super Admin panel
│   ├── privacy/               # Privacy policy
│   ├── terms/                 # Terms of service
│   └── api/
│       ├── slots/             # Slot availability API
│       ├── bookings/          # Booking CRUD + cancel/reschedule
│       ├── payments/          # Razorpay order creation + webhook
│       ├── cron/reminders/    # Scheduled reminder emails
│       └── admin/dashboard/   # Dashboard metrics API
├── lib/
│   ├── supabase/              # Client + server Supabase clients
│   ├── slot-engine.ts         # Core slot generation algorithm
│   ├── notifications.ts       # Email notification logic (Resend)
│   ├── payments.ts            # Razorpay integration
│   ├── utils.ts               # Shared utilities
│   └── validations/schemas.ts # Zod validation schemas
├── types/
│   ├── index.ts               # Shared TypeScript types
│   └── database.ts            # Supabase database types
└── components/
    └── ui/toaster.tsx         # Toast notification component

supabase/migrations/
├── 001_init_schema.sql        # Full database schema
└── 002_rls_policies.sql       # Row Level Security policies
```

---

## Key Design Decisions

- **Multi-tenancy via RLS**: Each business is a separate tenant. All data access enforced at the database level via Supabase Row Level Security.
- **Slot Engine**: Slots generated server-side on each request from working hours + existing bookings + leaves. No caching — always real-time.
- **10-minute buffer**: Automatically added after every booking in the slot engine.
- **24-hour rule**: Enforced server-side in cancel/reschedule routes. Business Admins are exempt.
- **Payment flow**: Booking created in `new` status → Razorpay order created → Payment confirmed via webhook → Status set to `confirmed`.
- **Cron reminders**: Vercel cron runs every 15 minutes, sends reminders for bookings in the T-24h and T-1h windows.

---

## Deployment (Vercel)

1. Push repo to GitHub
2. Import into Vercel
3. Add environment variables in Vercel dashboard
4. Vercel auto-detects `vercel.json` and configures the cron job

---

## Roles

| Role | Access |
|---|---|
| `super_admin` | Full platform access (set manually in DB) |
| `business_admin` | Manage their business, services, staff, bookings |
| `staff` | View assigned bookings, manage own availability |
| `customer` | Book, view, cancel/reschedule own appointments |

---

## Phase 2 Roadmap

- WhatsApp reminder integration (Twilio / Interakt)
- Custom domain per business
- Subscription tiers and billing
- Mobile app (React Native)
- Multi-currency / international payments
- Google Calendar sync
