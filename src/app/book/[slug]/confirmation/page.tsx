"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Service } from "@/types";
import { ArrowLeft, CalendarDays, Clock, User, Banknote, Smartphone } from "lucide-react";

declare global {
  interface Window { Razorpay: new (opts: object) => { open(): void }; }
}

export default function BookingConfirmationPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const serviceId = searchParams.get("serviceId")!;
  const staffId = searchParams.get("staffId")!;
  const startTime = searchParams.get("startTime")!;

  const [service, setService] = useState<Service | null>(null);
  const [business, setBusiness] = useState<{ id: string; name: string; timezone: string } | null>(null);
  const [staff, setStaff] = useState<{ name: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: biz } = await supabase.from("businesses").select("id,name,timezone").eq("slug", params.slug).single();
      const { data: svc } = await supabase.from("services").select("*").eq("id", serviceId).single();
      const { data: stf } = await supabase.from("profiles").select("name").eq("id", staffId).single();
      setBusiness(biz); setService(svc); setStaff(stf);
    }
    load();
  }, []);

  async function handleBook() {
    const { data: { session: _sess } } = await supabase.auth.getSession();
    const user = _sess?.user ?? null;
    if (!user) {
      router.push(`/login?redirectTo=${window.location.pathname}${window.location.search}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create booking
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, staff_id: staffId, start_time: startTime, notes }),
      });
      const { data: booking, error: bookingErr } = await res.json();
      if (bookingErr || !booking) throw new Error(bookingErr ?? "Failed to create booking");

      if (paymentMethod === "cod") {
        // COD — booking confirmed, pay at venue
        router.push(`/customer/bookings?booked=${booking.id}`);
        return;
      }

      // Online payment via Razorpay
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const { orderId, amount } = await orderRes.json();

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount, order_id: orderId,
          name: business?.name,
          description: service?.name,
          handler: () => { router.push(`/customer/bookings?booked=${booking.id}`); },
          prefill: { name: user.user_metadata?.name, email: user.email },
          theme: { color: "#2563eb" },
        });
        rzp.open();
      };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!service || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-lg">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Confirm Booking</h1>

        {/* Booking Summary */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Booking Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-slate-400">Service</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">{service.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Date &amp; Time
              </span>
              <span className="font-medium text-gray-900 dark:text-slate-100">{formatDateTime(startTime, business.timezone)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Duration
              </span>
              <span className="font-medium text-gray-900 dark:text-slate-100">{service.duration_minutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Staff
              </span>
              <span className="font-medium text-gray-900 dark:text-slate-100">{staff?.name ?? "Any Available"}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between text-base font-semibold">
              <span className="text-gray-900 dark:text-slate-100">Total</span>
              <span className="text-blue-700 dark:text-blue-400">{formatCurrency(service.price)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-3">Payment Method</h2>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              paymentMethod === "cod"
                ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
            }`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="text-blue-600 dark:accent-blue-400"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-500" /> Pay at Venue
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Pay in cash when you arrive</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              paymentMethod === "online"
                ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
            }`}>
              <input
                type="radio"
                name="payment"
                value="online"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
                className="text-blue-600 dark:accent-blue-400"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-500" /> Pay Online
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">UPI, card, net banking via Razorpay</p>
              </div>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            placeholder="Any special requests or notes for the service provider…"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/30"
        >
          {loading
            ? "Processing…"
            : paymentMethod === "cod"
              ? "Confirm Booking"
              : `Pay ${formatCurrency(service.price)} & Confirm`}
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-4">
          Cancellations and reschedules are allowed up to 24 hours before your appointment.
        </p>
      </div>
    </div>
  );
}
