"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle, User, X } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
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

    // Reload staff list and redirect to new staff's setup page
    setShowAdd(false);
    setName(""); setEmail(""); setPassword("");
    window.location.href = `/dashboard/staff/${data.staffId}?setup=true`;
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      {!staff.length ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <User className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-1 font-medium">No staff members yet</p>
          <p className="text-gray-400 text-sm mb-6">Add your first team member to start accepting bookings.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => {
            const memberServices = (member.staff_services as { service: { name: string } | null }[])
              ?.map(ss => ss.service?.name).filter(Boolean) ?? [];
            return (
              <div key={member.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{member.phone ?? "No phone"}</p>
                  </div>
                </div>
                {memberServices.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {memberServices.map((s) => (
                      <span key={s as string} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">No services assigned yet</p>
                )}
                <a href={`/dashboard/staff/${member.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                  Manage schedule →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">Add Staff Member</h2>
              <button onClick={() => { setShowAdd(false); setAddError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="staff@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Share this password with your staff member so they can log in.</p>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
