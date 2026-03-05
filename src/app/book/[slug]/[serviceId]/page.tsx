"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { Service, TimeSlot } from "@/types";
import { ArrowLeft, Clock, CreditCard, CalendarDays } from "lucide-react";

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
      const urlParams = new URLSearchParams({
        businessId: business.id,
        serviceId: service.id,
        date: dateStr,
      });

      const res = await fetch(`/api/slots?${urlParams.toString()}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Service header */}
        <div className="mb-6">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{business?.name}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{service?.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {service?.duration_minutes && (
              <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                <Clock className="w-4 h-4" /> {service.duration_minutes} min
              </span>
            )}
            {service?.price != null && (
              <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                <CreditCard className="w-4 h-4" /> {formatCurrency(service.price)}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Select a Date
            </h2>
            <style>{`
              .rdp {
                --rdp-accent-color: #2563eb;
                --rdp-background-color: #eff6ff;
              }
              .dark .rdp {
                --rdp-accent-color: #60a5fa;
                --rdp-background-color: rgba(37, 99, 235, 0.2);
                color: #e2e8f0;
              }
              .dark .rdp-day_disabled {
                color: #64748b;
              }
              .dark .rdp-nav_button {
                color: #94a3b8;
              }
              .dark .rdp-head_cell {
                color: #94a3b8;
              }
            `}</style>
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
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100 mb-3">
              Available — {format(selectedDate, "EEE, MMM d")}
            </h2>
            {loadingSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-slate-500 text-2xl mb-2">😴</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">No available slots</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSlot?.start === slot.start
                        ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
                        : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
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
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">
                {format(selectedDate, "EEEE, MMMM d")} at{" "}
                {business ? formatTime(selectedSlot.start, business.timezone) : ""}
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-sm">with {selectedSlot.staffName}</p>
            </div>
            <button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
