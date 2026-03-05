"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle, Users, X, Phone } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();
      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }
      await loadStaff(profile.business_id);
    }
    load();
  }, []);

  async function loadStaff(bid: string) {
    const { data } = await supabase.from("profiles")
      .select("*, staff_services(service_id, service:services(name))")
      .eq("business_id", bid)
      .eq("role", "staff");
    setStaff(data ?? []);
    setLoading(false);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error ?? "Something went wrong");
      setAdding(false);
      return;
    }
    setShowAdd(false);
    setName(""); setEmail(""); setPassword("");
    window.location.href = `/dashboard/staff/${data.staffId}?setup=true`;
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading staff…</p>
    </div>
  );

  // Generate a consistent avatar color from name
  const avatarColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 shrink-0">
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Staff</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage your team members</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Empty state */}
      {!staff.length ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/30 mx-auto mb-4">
            <Users className="w-8 h-8 text-violet-400 dark:text-violet-500" />
          </div>
          <p className="text-gray-700 dark:text-slate-200 font-semibold mb-1">No staff members yet</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">
            Add your first team member to start accepting bookings.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member, i) => {
            const memberServices = (member.staff_services as { service: { name: string } | null }[])
              ?.map(ss => ss.service?.name).filter(Boolean) ?? [];
            const avatarColor = avatarColors[i % avatarColors.length];
            return (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-700/40 transition-all overflow-hidden"
              >
                {/* Top accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 to-blue-500" />

                <div className="p-5">
                  {/* Avatar + info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${avatarColor}`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{member.name}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {member.phone ?? "No phone"}
                      </p>
                    </div>
                  </div>

                  {/* Services */}
                  {memberServices.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {memberServices.map((s) => (
                        <span
                          key={s as string}
                          className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-700/50 text-xs px-2 py-0.5 rounded-full font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 italic">No services assigned yet</p>
                  )}

                  {/* Footer link */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                    <a
                      href={`/dashboard/staff/${member.id}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
                    >
                      Manage schedule →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-700">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">Add Staff Member</h2>
              </div>
              <button
                onClick={() => { setShowAdd(false); setAddError(null); }}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="staff@example.com"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  Share this password with your staff member so they can log in.
                </p>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm"
              >
                {adding ? "Creating account…" : "Add Staff Member"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
