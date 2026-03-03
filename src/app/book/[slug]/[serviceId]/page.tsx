"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { Service, TimeSlot } from "@/types";

export default function SlotPickerPage() {
  const params = useParams<{ slug: string; serviceId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [service, setService] = useState<Service | null>(null);
  const [business, setBusiness] = useState<{ id: string; name: string; timezone: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Load business + service once
  useEffect(() => {
    async function load() {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, timezone")
        .eq("slug", params.slug)
        .single();
      const { data: svc } = await supabase
        .from("services")
        .select("*")
        .eq("id", params.serviceId)
        .single();
      setBusiness(biz);
      setService(svc);
    }
    load();
  }, [params.slug, params.serviceId]);

  // Load slots from API whenever date changes
  useEffect(() => {
    if (!business || !service) return;

    async function loadSlots() {
      if (!business || !service) return;
      setLoadingSlots(true);
      setSlots([]);

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        businessId: business.id,
        serviceId: service.id,
        date: dateStr,
      });

      const res = await fetch(`/api/slots?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[slots] API error", res.status, err);
      }

      setLoadingSlots(false);
    }

    loadSlots();
  }, [selectedDate, business, service]);

  function handleContinue() {
    if (!selectedSlot || !business) return;
    const p = new URLSearchParams({
      serviceId: params.serviceId,
      staffId: selectedSlot.staffId,
      startTime: selectedSlot.start,
    });
    router.push(`/book/${params.slug}/confirmation?${p.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="mb-6">
          <p className="text-sm text-gray-500 font-medium">{business?.name}</p>
          <h1 className="text-2xl font-bold text-gray-900">{service?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {service?.duration_minutes} min · {service ? formatCurrency(service.price) : ""}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Select a Date</h2>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }
              }}
              disabled={{ before: new Date() }}
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </div>

          {/* Time slots */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">
              Available Times — {format(selectedDate, "EEE, MMM d")}
            </h2>
            {loadingSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-2xl mb-2">😴</p>
                <p className="text-gray-500 text-sm font-medium">No available slots</p>
                <p className="text-gray-400 text-xs mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSlot?.start === slot.start
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {business ? formatTime(slot.start, business.timezone) : slot.start}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continue bar */}
        {selectedSlot && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                {format(selectedDate, "EEEE, MMMM d")} at{" "}
                {business ? formatTime(selectedSlot.start, business.timezone) : ""}
              </p>
              <p className="text-blue-700 text-sm">with {selectedSlot.staffName}</p>
            </div>
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
