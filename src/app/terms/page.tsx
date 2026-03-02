import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 block">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using BookMyThing, you agree to be bound by these Terms. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Use of the Platform</h2>
            <p>BookMyThing is a marketplace platform connecting customers with service providers. We are not responsible for the quality, safety, or legality of the services offered by businesses on the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Bookings and Payments</h2>
            <p>All bookings are subject to the availability set by individual businesses. Payments are processed securely via Razorpay. Refunds are managed by the business and are subject to their cancellation policy.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Cancellation Policy</h2>
            <p>Customers may cancel or reschedule bookings up to 24 hours before the appointment. Cancellations within 24 hours of the appointment may not be eligible for a refund, at the discretion of the business.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h2>
            <p>BookMyThing is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our liability is limited to the amount paid by you in the 30 days preceding the claim.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>For questions about these Terms, email us at <a href="mailto:legal@bookmything.com" className="text-blue-600">legal@bookmything.com</a>.</p>
          </section>
        </div>
      </div>
      <footer className="border-t mt-12 py-6 text-center text-gray-400 text-xs">
        <Link href="/privacy" className="hover:text-blue-600 mx-3">Privacy Policy</Link>
        <Link href="/contact" className="hover:text-blue-600 mx-3">Contact</Link>
      </footer>
    </div>
  );
}
