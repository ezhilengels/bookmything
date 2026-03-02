import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 block">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide when you register for an account, set up a business profile, or make a booking. This includes your name, email address, phone number, and payment information (processed securely by Razorpay — we do not store card data).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>We use your information to operate the BookMyThing platform, including processing bookings, sending appointment reminders, and providing customer support. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Data Storage</h2>
            <p>Your data is stored securely in Supabase (hosted on AWS). All data is encrypted at rest and in transit. We implement row-level security to ensure your data is isolated from other users.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Notifications</h2>
            <p>By creating an account and booking an appointment, you consent to receiving booking confirmations and appointment reminders via email. You may contact us to opt out of non-essential communications.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information at any time. To exercise these rights, please contact us at the email below.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>For privacy inquiries, email us at <a href="mailto:privacy@bookmything.com" className="text-blue-600">privacy@bookmything.com</a>.</p>
          </section>
        </div>
      </div>
      <footer className="border-t mt-12 py-6 text-center text-gray-400 text-xs">
        <Link href="/terms" className="hover:text-blue-600 mx-3">Terms of Service</Link>
        <Link href="/contact" className="hover:text-blue-600 mx-3">Contact</Link>
      </footer>
    </div>
  );
}
