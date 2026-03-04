"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { DAY_NAMES } from "@/lib/utils";

type DaySchedule = {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  id?: string;
};

const DEFAULT_HOURS: DaySchedule[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_active: i >= 1 && i <= 5, // Mon–Fri active by default
  start_time: "09:00",
  end_time: "18:00",
  break_start: "13:00",
  break_end: "14:00",
}));

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstSetup = searchParams.get("setup") === "true";
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_HOURS);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();
      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }

      const [memberRes, servicesRes, hoursRes, staffSvcRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("services").select("id,name").eq("business_id", profile.business_id).eq("is_active", true),
        supabase.from("working_hours").select("*").eq("staff_id", id).order("day_of_week"),
        supabase.from("staff_services").select("service_id").eq("staff_id", id),
      ]);

      if (memberRes.error || !memberRes.data) { router.push("/dashboard/staff"); return; }
      setMember(memberRes.data);
      setAllServices(servicesRes.data ?? []);
      setAssignedServiceIds((staffSvcRes.data ?? []).map((ss: any) => ss.service_id));

      // Merge existing hours into default schedule
      const existing = hoursRes.data ?? [];
      if (existing.length > 0) {
        const merged = DEFAULT_HOURS.map(def => {
          const found = existing.find((e: any) => e.day_of_week === def.day_of_week);
          if (found) return {
            id: found.id,
            day_of_week: found.day_of_week,
            is_active: found.is_active,
            start_time: found.start_time?.slice(0, 5) ?? "09:00",
            end_time: found.end_time?.slice(0, 5) ?? "18:00",
            break_start: found.break_start?.slice(0, 5) ?? "13:00",
            break_end: found.break_end?.slice(0, 5) ?? "14:00",
          };
          return def;
        });
        setSchedule(merged);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function updateDay(dayIndex: number, field: keyof DaySchedule, value: any) {
    setSchedule(prev => prev.map((d, i) => i === dayIndex ? { ...d, [field]: value } : d));
  }

  async function saveSchedule() {
    setSaving(true);
    // Upsert working hours
    const rows = schedule.map(d => ({
      ...(d.id ? { id: d.id } : {}),
      staff_id: id,
      day_of_week: d.day_of_week,
      is_active: d.is_active,
      start_time: d.start_time + ":00",
      end_time: d.end_time + ":00",
      break_start: d.is_active && d.break_start ? d.break_start + ":00" : null,
      break_end: d.is_active && d.break_end ? d.break_end + ":00" : null,
    }));

    const { error } = await supabase.from("working_hours").upsert(rows, { onConflict: "id" });
    if (error) {
      // If no id exists yet (first save), do insert
      const insertRows = rows.map(({ id: _id, ...rest }) => rest);
      const { error: err2 } = await supabase.from("working_hours").upsert(insertRows, { onConflict: "staff_id,day_of_week" });
      if (err2) { alert("Failed to save schedule: " + err2.message); setSaving(false); return; }
    }
    setSaving(false);
    alert("Schedule saved!");
  }

  async function toggleService(serviceId: string) {
    const isAssigned = assignedServiceIds.includes(serviceId);
    if (isAssigned) {
      await supabase.from("staff_services").delete().eq("staff_id", id).eq("service_id", serviceId);
      setAssignedServiceIds(prev => prev.filter(s => s !== serviceId));
    } else {
      await supabase.from("staff_services").insert({ staff_id: id, service_id: serviceId });
      setAssignedServiceIds(prev => [...prev, serviceId]);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/staff" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{member?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage schedule and services</p>
        </div>
      </div>

      {/* First-time setup banner */}
      {isFirstSetup && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-semibold text-sm">👋 Welcome! Let&apos;s set up your profile.</p>
          <p className="text-green-700 text-xs mt-1">
            Assign yourself to the services you provide, then set your working hours and hit <strong>Save Schedule</strong>. Your availability will be live immediately.
          </p>
        </div>
      )}

      {/* Services */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Assigned Services</h2>
        {allServices.length === 0 ? (
          <p className="text-sm text-gray-400">No active services yet. <Link href="/dashboard/services" className="text-blue-600 hover:underline">Add services first</Link>.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allServices.map(svc => {
              const assigned = assignedServiceIds.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    assigned
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {assigned ? "✓ " : ""}{svc.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Working Hours</h2>
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>

        <div className="space-y-3">
          {schedule.map((day, i) => (
            <div key={day.day_of_week} className={`rounded-lg border p-4 transition-colors ${day.is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}>
              <div className="flex items-center gap-3 mb-3">
                {/* Toggle */}
                <button
                  onClick={() => updateDay(i, "is_active", !day.is_active)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${day.is_active ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.is_active ? "translate-x-5" : ""}`} />
                </button>
                <span className={`text-sm font-medium w-24 ${day.is_active ? "text-gray-900" : "text-gray-400"}`}>
                  {DAY_NAMES[day.day_of_week]}
                </span>
                {!day.is_active && <span className="text-xs text-gray-400">Day off</span>}
              </div>

              {day.is_active && (
                <div className="grid grid-cols-2 gap-3 ml-14">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start</label>
                    <input
                      type="time"
                      value={day.start_time}
                      onChange={e => updateDay(i, "start_time", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">End</label>
                    <input
                      type="time"
                      value={day.end_time}
                      onChange={e => updateDay(i, "end_time", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Break Start</label>
                    <input
                      type="time"
                      value={day.break_start}
                      onChange={e => updateDay(i, "break_start", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Break End</label>
                    <input
                      type="time"
                      value={day.break_end}
                      onChange={e => updateDay(i, "break_end", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
