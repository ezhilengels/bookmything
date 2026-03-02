import Link from "next/link";
import { CalendarDays, CheckCircle, Bell, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-blue-700">BookMyThing</div>
        <nav className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-blue-700 transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Smart Appointment Booking <br />
          <span className="text-blue-600">for Modern Businesses</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          BookMyThing helps clinics, salons, coaches and freelancers manage availability,
          accept bookings and send automated reminders — all from one place.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start for Free
          </Link>
          <Link
            href="/book/demo-clinic"
            className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            See a Live Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: CalendarDays,
              title: "Smart Scheduling",
              desc: "Auto-generate time slots with 10-minute buffers and real-time availability.",
            },
            {
              icon: CheckCircle,
              title: "Easy Booking Flow",
              desc: "Customers book in under 2 minutes: service → slot → pay → confirmed.",
            },
            {
              icon: Bell,
              title: "Automated Reminders",
              desc: "Email reminders at 24h and 1h before every appointment. WhatsApp coming soon.",
            },
            {
              icon: BarChart3,
              title: "Revenue Dashboard",
              desc: "Track bookings, completion rates, and monthly revenue at a glance.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
              <Icon className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-gray-500 text-sm">
        <div className="flex gap-6 justify-center mb-4">
          <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} BookMyThing. All rights reserved.</p>
      </footer>
    </div>
  );
}
